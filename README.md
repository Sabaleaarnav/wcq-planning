# WCQ planning room

An event preparation dashboard for White Carnation Queen, built from the WQC and WCQ Scavenger Hunt Google Docs on October 27, 2026.

**[Open the WCQ planning dashboard](https://sabaleaarnav.github.io/wcq-planning/)** · [Manage tasks](https://github.com/Sabaleaarnav/wcq-planning/issues)

The five-day week is provisionally **November 9–13, 2026**. The user specified the week of the 9th; the documents do not give calendar dates. Confirm the dates before publishing the schedule.

## Use the tracker

- Open **Issues** for the shared task list. The website includes list, board, event-week, and planning-notes views.
- Create tasks using **New issue → WCQ task**.
- Edit the issue description to update **Status**, **Owner**, **Due date**, **Priority**, **Event day**, **Area**, and **Notes**.
- Use `To do`, `In progress`, or `Blocked`. Close the issue for `Done`; reopening makes it open again.
- Owners can be plain names or GitHub assignees. Plain names in the Owner section take precedence.
- Use confirmed dates in `YYYY-MM-DD` format. Unconfirmed deadlines remain blank.

Every task change rebuilds a snapshot through GitHub Actions. After Pages is enabled, it also publishes the updated website. The browser reads this shared snapshot; it does not store separate copies of task edits. Refresh loads the latest published snapshot. Changes made in Google Docs are not automatically imported.

Only task issues created by repository owners, members, or collaborators are imported into the dashboard. Public visitors can view the plan; an outside issue submission does not become a planning task.

Four initial tasks are closed because their deliverables are present in the docs: working lineup, initial house confirmations, shirt size count, and first scavenger outline. Other completion states are unverified. Initial confirmations are not a final team roster; shirt counts do not mean an order was placed.

## Hosting

The repository and dashboard are **public**, approved by the owner on October 27, 2026. GitHub Pages is configured to publish through GitHub Actions. The first public deployment was verified successfully.

Task changes and pushes to `main` automatically build and publish a fresh snapshot. You can also use **Actions → Refresh and publish WCQ dashboard → Run workflow** to refresh it manually.

The workflow skips public deployment if the repository is later made private. GitHub repository access is required to edit the plan.

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
