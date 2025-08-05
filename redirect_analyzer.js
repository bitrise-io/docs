const fs = require('fs');
const path = require('path');

// Load redirects from redirects.json
const redirectsPath = './redirects.json';
const outPath = process.argv[2] || './out';

function loadRedirects() {
    try {
        const redirectsData = fs.readFileSync(redirectsPath, 'utf8');
        return JSON.parse(redirectsData);
    } catch (error) {
        console.error('Error loading redirects.json:', error.message);
        return {};
    }
}

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function isExternalUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

function checkFileInOut(targetPath) {
    // Remove leading slash if present
    const cleanPath = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
    const fullPath = path.join(outPath, cleanPath);
    
    if (fileExists(fullPath)) {
        return { exists: true, path: fullPath };
    }
    
    // Try without .html extension
    if (cleanPath.endsWith('.html')) {
        const pathWithoutHtml = cleanPath.slice(0, -5);
        const fullPathWithoutHtml = path.join(outPath, pathWithoutHtml);
        if (fileExists(fullPathWithoutHtml)) {
            return { exists: true, path: fullPathWithoutHtml };
        }
    }
    
    return { exists: false, path: fullPath };
}

function findRedirectChains(redirects) {
    const chains = [];
    const invalidRedirects = [];
    const visited = new Set();
    
    for (const [source, target] of Object.entries(redirects)) {
        if (visited.has(source)) continue;
        
        const chain = [source];
        let currentTarget = target;
        const chainVisited = new Set([source]);
        
        // Follow the redirect chain
        while (currentTarget && !isExternalUrl(currentTarget)) {
            if (chainVisited.has(currentTarget)) {
                // Circular redirect detected
                chains.push({
                    type: 'circular',
                    chain: [...chain, currentTarget],
                    valid: false,
                    error: 'Circular redirect detected'
                });
                break;
            }
            
            chain.push(currentTarget);
            chainVisited.add(currentTarget);
            
            // Check if this target is also a source in redirects
            if (redirects[currentTarget]) {
                currentTarget = redirects[currentTarget];
            } else {
                // End of chain - check if final target exists
                const fileCheck = checkFileInOut(currentTarget);
                
                if (fileCheck.exists) {
                    chains.push({
                        type: 'valid',
                        chain: chain,
                        valid: true,
                        finalTarget: currentTarget,
                        finalFile: fileCheck.path
                    });
                } else {
                    invalidRedirects.push({
                        type: 'missing_file',
                        chain: chain,
                        valid: false,
                        finalTarget: currentTarget,
                        missingFile: currentTarget,
                        attemptedPath: fileCheck.path
                    });
                }
                break;
            }
        }
        
        // Handle external URLs
        if (isExternalUrl(currentTarget)) {
            chains.push({
                type: 'external',
                chain: chain,
                valid: true,
                finalTarget: currentTarget,
                externalUrl: currentTarget
            });
        }
        
        // Mark all items in this chain as visited
        for (const item of chainVisited) {
            visited.add(item);
        }
    }
    
    return { chains, invalidRedirects };
}

function groupRedirectsByTarget(chains, invalidRedirects) {
    // Group valid chains by final target
    const validByTarget = {};
    chains.filter(c => c.valid && c.type === 'valid').forEach(chain => {
        const target = chain.finalTarget;
        if (!validByTarget[target]) {
            validByTarget[target] = {
                target: target,
                finalFile: chain.finalFile,
                sources: []
            };
        }
        // Store the full chain instead of just the first item
        validByTarget[target].sources.push({
            chain: chain.chain,
            source: chain.chain[0]
        });
    });
    
    // Group external redirects by target URL
    const externalByTarget = {};
    chains.filter(c => c.type === 'external').forEach(chain => {
        const target = chain.finalTarget;
        if (!externalByTarget[target]) {
            externalByTarget[target] = {
                target: target,
                externalUrl: chain.externalUrl,
                sources: []
            };
        }
        // Store the full chain instead of just the first item
        externalByTarget[target].sources.push({
            chain: chain.chain,
            source: chain.chain[0]
        });
    });
    
    // Group invalid redirects by missing target
    const invalidByTarget = {};
    invalidRedirects.forEach(redirect => {
        const target = redirect.finalTarget;
        if (!invalidByTarget[target]) {
            invalidByTarget[target] = {
                target: target,
                missingFile: redirect.missingFile,
                sources: []
            };
        }
        // Store the full chain instead of just the first item
        invalidByTarget[target].sources.push({
            chain: redirect.chain,
            source: redirect.chain[0]
        });
    });
    
    // Group circular redirects (keep as is since they're usually unique)
    const circularChains = chains.filter(c => c.type === 'circular');
    
    return {
        validByTarget: Object.values(validByTarget).sort((a, b) => b.sources.length - a.sources.length),
        externalByTarget: Object.values(externalByTarget).sort((a, b) => b.sources.length - a.sources.length),
        invalidByTarget: Object.values(invalidByTarget).sort((a, b) => b.sources.length - a.sources.length),
        circularChains: circularChains
    };
}

function generateHtmlReport(data) {
    const { total, validByTarget, externalByTarget, invalidByTarget, circularChains, validChains, externalChains, invalidRedirects } = data;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirect Analysis Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .number {
            font-size: 2rem;
            font-weight: bold;
            margin: 0;
        }
        .summary-card .sub-number {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        .valid { color: #28a745; }
        .external { color: #007bff; }
        .invalid { color: #dc3545; }
        .circular { color: #ffc107; }
        .total { color: #6c757d; }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            padding: 20px;
            font-size: 1.2rem;
            font-weight: bold;
            border-bottom: 1px solid #eee;
        }
        .section-content {
            padding: 20px;
        }
        .card {
            background: #ffffff;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        .card:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        details {
            border: none;
            background: none;
        }
        details summary {
            padding: 16px 20px;
            cursor: pointer;
            list-style: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            color: #333;
            border-radius: 6px;
            transition: background-color 0.2s;
        }
        details summary:hover {
            background-color: #f8f9fa;
        }
        details summary::-webkit-details-marker {
            display: none;
        }
        .summary-title {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            flex: 1;
            word-break: break-all;
        }
        .summary-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 16px;
        }
        .count-badge {
            background: #007bff;
            color: white;
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: bold;
            min-width: 20px;
            text-align: center;
        }
        .count-badge.valid { background: #28a745; }
        .count-badge.external { background: #007bff; }
        .count-badge.invalid { background: #dc3545; }
        .expand-icon {
            font-size: 0.8rem;
            color: #666;
            transition: transform 0.2s;
        }
        details[open] .expand-icon {
            transform: rotate(180deg);
        }
        .card-content {
            padding: 0 20px 16px 20px;
            border-top: 1px solid #e1e5e9;
            background-color: #fafbfc;
        }
        .source-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 12px;
        }
        .source-item {
            background: #ffffff;
            border: 1px solid #d0d7de;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8rem;
            color: #333;
            margin-bottom: 4px;
            display: block;
            width: 100%;
        }
        .chain-display {
            background: #f8f9fa;
            border: 1px solid #e1e5e9;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 6px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8rem;
        }
        .chain-step {
            display: inline;
            color: #333;
        }
        .chain-arrow {
            color: #666;
            margin: 0 6px;
            font-weight: bold;
        }
        .file-info {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8rem;
            color: #666;
            margin-top: 8px;
            padding: 8px 12px;
            background: #f6f8fa;
            border-radius: 4px;
            border-left: 3px solid #28a745;
        }
        .file-path {
            font-size: 0.8rem;
            color: #666;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .external-link {
            color: #007bff;
            text-decoration: none;
            word-break: break-all;
        }
        .external-link:hover {
            text-decoration: underline;
        }
        .no-items {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
        }
        .collapsible {
            cursor: pointer;
            user-select: none;
        }
        .collapsible:hover {
            background-color: #f1f3f4;
        }
        .content {
            display: none;
        }
        .content.active {
            display: block;
        }
        .toggle-icon {
            float: right;
            transition: transform 0.3s;
        }
        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        .chain-cell {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.85rem;
            word-break: break-all;
        }
        .arrow {
            color: #666;
            margin: 0 8px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 Redirect Analysis Report</h1>
        <p>Generated on ${timestamp}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Redirects</h3>
            <div class="number total">${total}</div>
        </div>
        <div class="summary-card">
            <h3>Valid Targets</h3>
            <div class="number valid">${validByTarget.length}</div>
            <div class="sub-number">${validChains.length} redirects</div>
        </div>
        <div class="summary-card">
            <h3>External Targets</h3>
            <div class="number external">${externalByTarget.length}</div>
            <div class="sub-number">${externalChains.length} redirects</div>
        </div>
        <div class="summary-card">
            <h3>Missing Targets</h3>
            <div class="number invalid">${invalidByTarget.length}</div>
            <div class="sub-number">${invalidRedirects.length} redirects</div>
        </div>
        <div class="summary-card">
            <h3>Circular</h3>
            <div class="number circular">${circularChains.length}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header collapsible valid" onclick="toggleSection('valid')">
            ✅ Valid Targets (${validByTarget.length} unique, ${validChains.length} total redirects)
            <span class="toggle-icon">▼</span>
        </div>
        <div id="valid" class="section-content content">
            ${validByTarget.length > 0 ? `
                ${validByTarget.map(group => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${group.target}</span>
                                <div class="summary-info">
                                    <span class="count-badge valid">${group.sources.length}</span>
                                    <span class="expand-icon">▼</span>
                                </div>
                            </summary>
                            <div class="card-content">
                                <div class="file-info">📁 File: ${group.finalFile.replace(outPath + '/', '')}</div>
                                <div class="source-list">
                                    ${group.sources.map(sourceInfo => {
                                        if (sourceInfo.chain.length === 1) {
                                            // Single redirect, show as before
                                            return `<div class="source-item">${sourceInfo.source}</div>`;
                                        } else {
                                            // Multi-step redirect, show the full chain
                                            return `<div class="chain-display">
                                                ${sourceInfo.chain.filter(step => step !== group.target).map(step => `<span class="chain-step">${step}</span>`).join('<span class="chain-arrow">→</span>')}
                                            </div>`;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        </details>
                    </div>
                `).join('')}
            ` : '<div class="no-items">No valid targets found.</div>'}
        </div>
    </div>

    <div class="section">
        <div class="section-header collapsible external" onclick="toggleSection('external')">
            🌐 External Targets (${externalByTarget.length} unique, ${externalChains.length} total redirects)
            <span class="toggle-icon">▼</span>
        </div>
        <div id="external" class="section-content content">
            ${externalByTarget.length > 0 ? `
                ${externalByTarget.map(group => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${group.target}</span>
                                <div class="summary-info">
                                    <span class="count-badge external">${group.sources.length}</span>
                                    <span class="expand-icon">▼</span>
                                </div>
                            </summary>
                            <div class="card-content">
                                <div class="file-info">🌐 External: <a href="${group.target}" target="_blank" class="external-link">${group.target}</a></div>
                                <div class="source-list">
                                    ${group.sources.map(sourceInfo => {
                                        if (sourceInfo.chain.length === 1) {
                                            // Single redirect, show as before
                                            return `<div class="source-item">${sourceInfo.source}</div>`;
                                        } else {
                                            // Multi-step redirect, show the full chain
                                            return `<div class="chain-display">
                                                ${sourceInfo.chain.filter(step => step !== group.target).map(step => `<span class="chain-step">${step}</span>`).join('<span class="chain-arrow">→</span>')}
                                            </div>`;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        </details>
                    </div>
                `).join('')}
            ` : '<div class="no-items">No external targets found.</div>'}
        </div>
    </div>

    <div class="section">
        <div class="section-header collapsible invalid" onclick="toggleSection('invalid')">
            ❌ Missing Targets (${invalidByTarget.length} unique, ${invalidRedirects.length} total redirects)
            <span class="toggle-icon">▼</span>
        </div>
        <div id="invalid" class="section-content content active">
            ${invalidByTarget.length > 0 ? `
                ${invalidByTarget.map(group => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${group.target}</span>
                                <div class="summary-info">
                                    <span class="count-badge invalid">${group.sources.length}</span>
                                    <span class="expand-icon">▼</span>
                                </div>
                            </summary>
                            <div class="card-content">
                                <div class="source-list">
                                    ${group.sources.map(sourceInfo => {
                                        if (sourceInfo.chain.length === 1) {
                                            // Single redirect, show as before
                                            return `<div class="source-item">${sourceInfo.source}</div>`;
                                        } else {
                                            // Multi-step redirect, show the full chain
                                            return `<div class="chain-display">
                                                ${sourceInfo.chain.filter(step => step !== group.target).map(step => `<span class="chain-step">${step}</span>`).join('<span class="chain-arrow">→</span>')}
                                            </div>`;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        </details>
                    </div>
                `).join('')}
            ` : '<div class="no-items">No missing targets found!</div>'}
        </div>
    </div>

    <div class="section">
        <div class="section-header collapsible circular" onclick="toggleSection('circular')">
            🔄 Circular Redirects (${circularChains.length})
            <span class="toggle-icon">▼</span>
        </div>
        <div id="circular" class="section-content content">
            ${circularChains.length > 0 ? `
                ${circularChains.map(chain => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${chain.chain.join(' → ')}</span>
                                <div class="summary-info">
                                    <span class="count-badge circular">⚠️</span>
                                    <span class="expand-icon">▼</span>
                                </div>
                            </summary>
                            <div class="card-content">
                                <div class="file-info" style="border-left-color: #ffc107;">⚠️ Error: ${chain.error}</div>
                            </div>
                        </details>
                    </div>
                `).join('')}
            ` : '<div class="no-items">No circular redirects found!</div>'}
        </div>
    </div>

    <script>
        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId);
            const header = content.previousElementSibling;
            const icon = header.querySelector('.toggle-icon');
            
            content.classList.toggle('active');
            icon.classList.toggle('rotated');
        }
    </script>
</body>
</html>`;
    
    return html;
}

function saveHtmlReport(htmlContent) {
    const outputPath = path.join(outPath, '_redirects.html');
    try {
        fs.writeFileSync(outputPath, htmlContent, 'utf8');
        console.log(`\n📄 HTML report saved to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error saving HTML report:', error.message);
        return null;
    }
}

function analyzeRedirects() {
    console.log('🔍 Loading redirects from', redirectsPath);
    const redirects = loadRedirects();
    const redirectCount = Object.keys(redirects).length;
    console.log(`📊 Found ${redirectCount} redirects to analyze\n`);
    
    console.log('🔗 Analyzing redirect chains...\n');
    const { chains, invalidRedirects } = findRedirectChains(redirects);
    
    // Group redirects by target
    const { validByTarget, externalByTarget, invalidByTarget, circularChains } = groupRedirectsByTarget(chains, invalidRedirects);
    
    const data = {
        total: redirectCount,
        validByTarget: validByTarget,
        externalByTarget: externalByTarget,
        invalidByTarget: invalidByTarget,
        circularChains: circularChains,
        // Keep legacy format for summary counts
        validChains: chains.filter(c => c.valid && c.type === 'valid'),
        externalChains: chains.filter(c => c.type === 'external'),
        invalidRedirects: invalidRedirects
    };
    
    // Generate and save HTML report
    const htmlContent = generateHtmlReport(data);
    saveHtmlReport(htmlContent);
    
    // Print results
    console.log('📈 ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n✅ VALID TARGETS (${validByTarget.length} unique targets, ${data.validChains.length} total redirects):`);
    if (validByTarget.length > 0) {
        validByTarget.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
            console.log(`   📁 File: ${group.finalFile.replace(outPath + '/', '')}`);
            // Show first few sources with chain info
            const sourcesToShow = group.sources.slice(0, 3);
            sourcesToShow.forEach(sourceInfo => {
                if (sourceInfo.chain.length === 1) {
                    console.log(`   📍 ${sourceInfo.source}`);
                } else {
                    console.log(`   📍 ${sourceInfo.chain.join(' → ')}`);
                }
            });
            if (group.sources.length > 3) {
                console.log(`   📍 +${group.sources.length - 3} more redirects`);
            }
            console.log();
        });
        if (validByTarget.length > 10) {
            console.log(`   ... and ${validByTarget.length - 10} more valid targets\n`);
        }
    } else {
        console.log('   No valid targets found.\n');
    }
    
    console.log(`\n🌐 EXTERNAL TARGETS (${externalByTarget.length} unique targets, ${data.externalChains.length} total redirects):`);
    if (externalByTarget.length > 0) {
        externalByTarget.slice(0, 5).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
            // Show first few sources with chain info
            const sourcesToShow = group.sources.slice(0, 3);
            sourcesToShow.forEach(sourceInfo => {
                if (sourceInfo.chain.length === 1) {
                    console.log(`   📍 ${sourceInfo.source}`);
                } else {
                    console.log(`   📍 ${sourceInfo.chain.join(' → ')}`);
                }
            });
            if (group.sources.length > 3) {
                console.log(`   📍 +${group.sources.length - 3} more redirects`);
            }
            console.log();
        });
        if (externalByTarget.length > 5) {
            console.log(`   ... and ${externalByTarget.length - 5} more external targets\n`);
        }
    } else {
        console.log('   No external targets found.\n');
    }
    
    console.log(`\n❌ MISSING TARGETS (${invalidByTarget.length} unique targets, ${invalidRedirects.length} total redirects):`);
    if (invalidByTarget.length > 0) {
        invalidByTarget.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
            // Show first few sources with chain info
            const sourcesToShow = group.sources.slice(0, 3);
            sourcesToShow.forEach(sourceInfo => {
                if (sourceInfo.chain.length === 1) {
                    console.log(`   📍 ${sourceInfo.source}`);
                } else {
                    console.log(`   📍 ${sourceInfo.chain.join(' → ')}`);
                }
            });
            if (group.sources.length > 3) {
                console.log(`   📍 +${group.sources.length - 3} more redirects`);
            }
            console.log();
        });
        if (invalidByTarget.length > 10) {
            console.log(`   ... and ${invalidByTarget.length - 10} more missing targets\n`);
        }
    } else {
        console.log('   No missing targets found!\n');
    }
    
    console.log(`\n🔄 CIRCULAR REDIRECTS (${circularChains.length}):`);
    if (circularChains.length > 0) {
        circularChains.forEach((chain, index) => {
            console.log(`${index + 1}. ${chain.chain.join(' → ')}`);
            console.log(`   ⚠️  ${chain.error}\n`);
        });
    } else {
        console.log('   No circular redirects found!\n');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(30));
    console.log(`Total redirects analyzed: ${redirectCount}`);
    console.log(`Valid targets: ${validByTarget.length} (${data.validChains.length} redirects)`);
    console.log(`External targets: ${externalByTarget.length} (${data.externalChains.length} redirects)`);
    console.log(`Missing targets: ${invalidByTarget.length} (${invalidRedirects.length} redirects)`);
    console.log(`Circular redirects: ${circularChains.length}`);
    
    return data;
}

// Run the analysis
if (require.main === module) {
    analyzeRedirects();
}

module.exports = { analyzeRedirects, loadRedirects, findRedirectChains, groupRedirectsByTarget, generateHtmlReport, saveHtmlReport };
