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

function findRedirectMatch(target, redirects) {
    // First check for exact match
    if (redirects[target]) {
        return redirects[target];
    }
    
    // If target ends with .html, check for version without .html
    if (target.endsWith('.html')) {
        const withoutHtml = target.slice(0, -5);
        if (redirects[withoutHtml]) {
            return redirects[withoutHtml];
        }
    } else {
        // If target doesn't end with .html, check for version with .html
        const withHtml = target + '.html';
        if (redirects[withHtml]) {
            return redirects[withHtml];
        }
    }
    
    return null;
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
            
            // Check if this target is also a source in redirects (with .html variants)
            const nextTarget = findRedirectMatch(currentTarget, redirects);
            if (nextTarget) {
                currentTarget = nextTarget;
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
    
    // Group invalid redirects by missing target, but separate those with $1 in the target (preserve_path_suffix)
    const invalidByTarget = {};
    const preservePathSuffixByTarget = {};
    invalidRedirects.forEach(redirect => {
        const target = redirect.finalTarget;
        if (typeof target === 'string' && target.includes('$1')) {
            if (!preservePathSuffixByTarget[target]) {
                preservePathSuffixByTarget[target] = {
                    target: target,
                    missingFile: redirect.missingFile,
                    sources: []
                };
            }
            preservePathSuffixByTarget[target].sources.push({
                chain: redirect.chain,
                source: redirect.chain[0]
            });
        } else {
            if (!invalidByTarget[target]) {
                invalidByTarget[target] = {
                    target: target,
                    missingFile: redirect.missingFile,
                    sources: []
                };
            }
            invalidByTarget[target].sources.push({
                chain: redirect.chain,
                source: redirect.chain[0]
            });
        }
    });

    // Group circular redirects (keep as is since they're usually unique)
    const circularChains = chains.filter(c => c.type === 'circular');

    return {
        validByTarget: Object.values(validByTarget).sort((a, b) => b.sources.length - a.sources.length),
        externalByTarget: Object.values(externalByTarget).sort((a, b) => b.sources.length - a.sources.length),
        invalidByTarget: Object.values(invalidByTarget).sort((a, b) => b.sources.length - a.sources.length),
        preservePathSuffixByTarget: Object.values(preservePathSuffixByTarget).sort((a, b) => b.sources.length - a.sources.length),
        circularChains: circularChains
    };
}

function generateHtmlReport(data) {
    const { total, validByTarget, externalByTarget, invalidByTarget, preservePathSuffixByTarget, circularChains, validChains, externalChains, invalidRedirects } = data;
    // Count for preserve_path_suffix
    const preservePathSuffixCount = preservePathSuffixByTarget ? preservePathSuffixByTarget.length : 0;
    const preservePathSuffixRedirects = preservePathSuffixByTarget ? preservePathSuffixByTarget.reduce((acc, group) => acc + group.sources.length, 0) : 0;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    // Generate badge SVG for embedding
    const totalValid = validChains.length + externalChains.length;
    const totalInvalid = invalidRedirects.length + circularChains.length - (preservePathSuffixByTarget ? preservePathSuffixByTarget.reduce((acc, group) => acc + group.sources.length, 0) : 0);
    const badgeSvg = generateBadgeSvg(totalValid, totalInvalid);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirect Analysis Report</title>
    <link rel="stylesheet" href="./css/_redirects.css">
</head>
<body>
    <div class="header">
        <h1>Redirect Analysis Report</h1>
        <div style="margin: 18px 0 10px 0;">${badgeSvg}</div>
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
            <div class="sub-number">${invalidRedirects.length - preservePathSuffixRedirects} redirects</div>
        </div>
        <div class="summary-card">
            <h3>Circular</h3>
            <div class="number circular">${circularChains.length}</div>
        </div>        <div class="summary-card">
            <h3>Preserve Path Suffix</h3>
            <div class="number" style="color: #888;">${preservePathSuffixCount}</div>
            <div class="sub-number">${preservePathSuffixRedirects} redirects</div>
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
            ❌ Missing Targets (${invalidByTarget.length} unique, ${invalidRedirects.length - preservePathSuffixRedirects} total redirects)
            <span class="toggle-icon">▼</span>
        </div>
        <div id="invalid" class="section-content content ${invalidByTarget.length > 0 ? 'active' : ''}">
            ${invalidByTarget.length > 0 ? `
                ${invalidByTarget.map(group => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${group.target}</span>
                                <div class="summary-info">
                                    <span class="count-badge invalid">${group.sources.length}</span>
                                    <span class="expand-icon ${invalidByTarget.length > 0 ? 'rotated' : ''}">▼</span>
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

    <div class="section">
        <div class="section-header collapsible" style="color: #888;" onclick="toggleSection('preserve_path_suffix')">
            🪄 Preserve Path Suffix (${preservePathSuffixByTarget.length} unique, ${preservePathSuffixRedirects} total redirects)
            <span class="toggle-icon">▼</span>
        </div>
        <div id="preserve_path_suffix" class="section-content content">
            ${preservePathSuffixByTarget.length > 0 ? `
                ${preservePathSuffixByTarget.map(group => `
                    <div class="card">
                        <details>
                            <summary>
                                <span class="summary-title">${group.target}</span>
                                <div class="summary-info">
                                    <span class="count-badge" style="background: #888;">${group.sources.length}</span>
                                    <span class="expand-icon">▼</span>
                                </div>
                            </summary>
                            <div class="card-content">
                                <div class="source-list">
                                    ${group.sources.map(sourceInfo => {
                                        if (sourceInfo.chain.length === 1) {
                                            return `<div class="source-item">${sourceInfo.source}</div>`;
                                        } else {
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
            ` : '<div class="no-items">No preserve path suffix redirects found!</div>'}
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

function generateBadgeSvg(validCount, invalidCount) {
    const hasInvalid = invalidCount > 0;
    const rightText = hasInvalid ? `${invalidCount} invalid` : `${validCount} valid`;
    const rightColor = hasInvalid ? '#e05d44' : '#4c1'; // Red for invalid, green for valid
    
    // Calculate text widths (approximate)
    const leftText = 'Redirects';
    const leftWidth = leftText.length * 7 + 10; // Approximate width
    const rightWidth = rightText.length * 7 + 10;
    const totalWidth = leftWidth + rightWidth;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
    <defs>
        <linearGradient id="b" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
        <clipPath id="a">
            <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
        </clipPath>
    </defs>
    <g clip-path="url(#a)">
        <path fill="#555" d="M0 0h${leftWidth}v20H0z"/>
        <path fill="${rightColor}" d="M${leftWidth} 0h${rightWidth}v20H${leftWidth}z"/>
        <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
        <text x="${leftWidth / 2 * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(leftWidth - 10) * 10}">${leftText}</text>
        <text x="${leftWidth / 2 * 10}" y="140" transform="scale(.1)" textLength="${(leftWidth - 10) * 10}">${leftText}</text>
        <text x="${(leftWidth + rightWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(rightWidth - 10) * 10}">${rightText}</text>
        <text x="${(leftWidth + rightWidth / 2) * 10}" y="140" transform="scale(.1)" textLength="${(rightWidth - 10) * 10}">${rightText}</text>
    </g>
</svg>`;
    
    return svg;
}

function saveBadge(validCount, invalidCount) {
    const svgContent = generateBadgeSvg(validCount, invalidCount);
    const outputPath = path.join(outPath, '_redirects.svg');
    
    try {
        fs.writeFileSync(outputPath, svgContent, 'utf8');
        console.log(`🏷️  Badge saved to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error saving badge:', error.message);
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
    const { validByTarget, externalByTarget, invalidByTarget, preservePathSuffixByTarget, circularChains } = groupRedirectsByTarget(chains, invalidRedirects);

    const data = {
        total: redirectCount,
        validByTarget: validByTarget,
        externalByTarget: externalByTarget,
        invalidByTarget: invalidByTarget,
        preservePathSuffixByTarget: preservePathSuffixByTarget,
        circularChains: circularChains,
        // Keep legacy format for summary counts
        validChains: chains.filter(c => c.valid && c.type === 'valid'),
        externalChains: chains.filter(c => c.type === 'external'),
        invalidRedirects: invalidRedirects
    };
    
    // Generate and save HTML report
    const htmlContent = generateHtmlReport(data);
    saveHtmlReport(htmlContent);
    
    // Generate and save badge
    const totalValid = data.validChains.length + data.externalChains.length;
    const totalInvalid = invalidRedirects.length + circularChains.length;
    saveBadge(totalValid, totalInvalid);
    
    // Print results
    console.log('📈 ANALYSIS RESULTS:');
    console.log('='.repeat(50));

    // Valid
    console.log(`\n✅ VALID TARGETS (${validByTarget.length} unique targets, ${data.validChains.length} total redirects):`);
    if (validByTarget.length > 0) {
        validByTarget.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
            console.log(`   📁 File: ${group.finalFile.replace(outPath + '/', '')}`);
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

    // External
    console.log(`\n🌐 EXTERNAL TARGETS (${externalByTarget.length} unique targets, ${data.externalChains.length} total redirects):`);
    if (externalByTarget.length > 0) {
        externalByTarget.slice(0, 5).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
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

    // Missing
    const preservePathSuffixCount = preservePathSuffixByTarget.length;
    const preservePathSuffixRedirects = preservePathSuffixByTarget.reduce((acc, group) => acc + group.sources.length, 0);
    const missingRedirectsCount = invalidRedirects.length - preservePathSuffixRedirects;
    console.log(`\n❌ MISSING TARGETS (${invalidByTarget.length} unique targets, ${missingRedirectsCount} total redirects):`);
    if (invalidByTarget.length > 0) {
        invalidByTarget.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
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

    // Preserve Path Suffix
    console.log(`\n🪄 PRESERVE PATH SUFFIX (${preservePathSuffixCount} unique targets, ${preservePathSuffixRedirects} total redirects):`);
    if (preservePathSuffixCount > 0) {
        preservePathSuffixByTarget.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.target} (${group.sources.length} redirects)`);
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
        if (preservePathSuffixCount > 10) {
            console.log(`   ... and ${preservePathSuffixCount - 10} more preserve path suffix targets\n`);
        }
    } else {
        console.log('   No preserve path suffix redirects found!\n');
    }

    // Circular
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
    console.log(`Missing targets: ${invalidByTarget.length} (${missingRedirectsCount} redirects)`);
    console.log(`Preserve path suffix: ${preservePathSuffixCount} (${preservePathSuffixRedirects} redirects)`);
    console.log(`Circular redirects: ${circularChains.length}`);
    
    return data;
}

// Run the analysis
if (require.main === module) {
    analyzeRedirects();
}

module.exports = { analyzeRedirects, loadRedirects, findRedirectChains, groupRedirectsByTarget, generateHtmlReport, saveHtmlReport, generateBadgeSvg, saveBadge };
