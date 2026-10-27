# WCQ planning room

An event preparation dashboard for White Carnation Queen, built from the WQC and WCQ Scavenger Hunt Google Docs on October 27, 2026.

The five-day week is provisionally **November 9–13, 2026**. The user specified the week of the 9th; the documents do not give calendar dates. Confirm the dates before publishing the schedule.

## Use the tracker

- Open **Issues** for the shared task list. The website includes list, board, event-week, and planning-notes views.
- Create tasks using **New issue → WCQ task**.
- Edit the issue description to update **Status**, **Owner**, **Due date**, **Priority**, **Event day**, **Area**, and **Notes**.
- Use `To do`, `In progress`, or `Blocked`. Close the issue for `Done`; reopening makes it open again.
- Owners can be plain names or GitHub assignees. Plain names in the Owner section take precedence.
- Use confirmed dates in `YYYY-MM-DD` format. Unconfirmed deadlines remain blank.

Every task change rebuilds a snapshot through GitHub Actions. After Pages is enabled, it also publishes the updated website. The browser reads this shared snapshot; it does not store separate copies of task edits. Refresh loads the latest published snapshot. Changes made in Google Docs are not automatically imported.

Four initial tasks are closed because their deliverables are present in the docs: working lineup, initial house confirmations, shirt size count, and first scavenger outline. Other completion states are unverified. Initial confirmations are not a final team roster; shirt counts do not mean an order was placed.

## Hosting

The repository was created **private** for review. Public publishing requires explicit approval. The workflow builds private review artifacts and skips public deployment while the repository is private.

After approval to make the task data public:

1. Change the repository visibility to public, or use an eligible GitHub plan for Pages from a private repository. A private repository alone does not make a Pages website private.
2. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run **Actions → Refresh and publish WCQ dashboard → Run workflow**. The deployment job reports the actual website URL.

The workflow deliberately skips deployment from private repositories. If keeping a private source repository on an eligible plan, change the deployment condition only after confirming the intended website audience.

## Local preview

```sh
npm run dev
```

Open the printed local URL. No package installation is needed. The committed `docs/data.json` is a snapshot; GitHub Actions generates a current copy for each build. The private review artifact also contains the current copy.

```sh
npm run check
npm test
```

## Files

- `planning.json`: event lineup, source links, factual notes, and date assumptions.
- `docs/`: buildless website and initial task snapshot.
- `scripts/parse-issue.mjs`: issue-to-task field mapping.
- `scripts/sync-issues.mjs`: authenticated, paginated issue snapshot export.
- `.github/ISSUE_TEMPLATE/task.yml`: consistent task entry form.
- `.github/workflows/dashboard.yml`: snapshot validation and Pages deployment.

No authentication tokens are embedded in the website. GitHub editing requires repository write access. Source Drive permissions are unchanged. Personal contact details, relationship notes, rejected-house predictions, checkpoint locations, and trivia answers were not copied into the tracker.
