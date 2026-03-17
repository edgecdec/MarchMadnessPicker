# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Mobile navbar should be a hamburger menu**: On small screens the navbar links overflow across the top and are hard to tap. Replace with a hamburger icon (☰) that opens a slide-out or dropdown menu with all nav options. Keep the full horizontal navbar on desktop. Use MUI Drawer or a simple dropdown — no external dependencies.

- **Stray "0" displayed next to max brackets text on group page**: The group page shows "Max 1 bracket per member0" — there's a `0` being rendered after the max brackets text. Likely a variable being concatenated or a child element rendering a falsy value. Check the group detail page component where max_brackets is displayed.

- **Group creator can remove members even without a bracket**: Add a remove/kick button next to each member on the group page, visible only to the group creator. Currently you can only remove brackets, but some members may have joined without adding a bracket. The remove button should delete the member from group_members (and any bracket assignments they have in the group). Confirmation dialog before removing.

- **Group creator can delete the group**: Add a "Delete Group" button on the group settings/detail page, visible only to the creator. Deletes the group, all group_members, and all bracket-group assignments. Confirmation dialog with the group name typed to confirm. Does NOT delete the members' accounts or their brackets — just the group association.
