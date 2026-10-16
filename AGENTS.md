<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All AI calls go through server functions in `src/lib/ai.functions.ts`, which call `src/lib/ai.server.ts`; prompts are defined server-side so the browser never holds the key or arbitrary system prompts.
- Workspace data (tasks, emails, research, settings) lives in the localStorage store `src/lib/store.ts`; there are no accounts yet, so a database would be publicly writable.
- Cross-tool handoffs (Research/Tasks/Email) use the store's `emailDraft` / `goalDraft` fields, consumed and cleared by the destination page.
