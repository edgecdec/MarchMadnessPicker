# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Group creator can remove members even without a bracket**: Add a remove/kick button next to each member on the group page, visible only to the group creator. Currently you can only remove brackets, but some members may have joined without adding a bracket. The remove button should delete the member from group_members (and any bracket assignments they have in the group). Confirmation dialog before removing.

- **Group creator can delete the group**: Add a "Delete Group" button on the group settings/detail page, visible only to the creator. Deletes the group, all group_members, and all bracket-group assignments. Confirmation dialog with the group name typed to confirm. Does NOT delete the members' accounts or their brackets — just the group association.
