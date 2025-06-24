export const addSidebarLinks = () => {
  const sidebarLinks = document.createElement('li');
  sidebarLinks.className = 'sidebar-links opened';
  sidebarLinks.innerHTML = `
    <ul>
      <li><a data-externallink="integrations" href="https://bitrise.io/integrations" target="_blank">
        <span class="glyphicon"></span>
        Bitrise Integration Steps
      </a></li>
      <li><a data-externallink="workflow-recipes" href="https://github.com/bitrise-io/workflow-recipes" target="_blank">
        <span class="glyphicon"></span>
        Bitrise Workflow Recipes
      </a></li>
    </ul>
  `;
  document.querySelector('.nav-site-sidebar').appendChild(sidebarLinks);
  return () => {
    sidebarLinks.remove();
  };
};
