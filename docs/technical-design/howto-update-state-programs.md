# How to update state programs

State programs are an important set of data in MC-Review. Currently, all submissions must have a program. Programs are also used in submission and rate names in communication.

For pilot rollout of MC-Review, state programs are stored in a JSON file `stateProgram.json`. The state programs json is referenced both client-side, to display the program dropdowns, and server-side in API requests that include program data.

The source of truth for that file comes from a CSV maintained by product and design. It is titled "State programs, population, and nicknames" in Google Drive. When that team adds or updates programs and would like the changes reflected in MC-Review, the dev team needs update our stored JSON using `scripts/import-programs.ts`. Steps to update are:

1. Download the latest version of csv from google docs when prompted by product/design.
2. Run the script following the command listed in the  `import-programs.ts`.
3. Overwrite existing state programs JSON with the new output. Your usage of the script will likely look something like this:  `cd scripts && yarn tsc && node import-programs.js ~/Desktop/State\ programs,\ population,\ and\ nicknames.csv > ../services/app-web/src/common-code/data/statePrograms.json`
4. Double check the diff. It's important not to delete any programs that have already been used for a submission because although programs are not in the database, we still store references to the program ID in postgres as if they are stable. Also, we want to be sure we are only changing programs expected to change.
5. Make a PR to update the statePrograms file in the codebase
