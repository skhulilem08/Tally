# JavaScript client contract

Use `api(path, {method, body, signal})` from `src/api.js`; returns parsed JSON directly, errors throw with `message` and `status`. All routes are cookie-authenticated; signed-out reads return 401. Use Clerk's `useUser`/`useAuth` state, never token handling. No invented records and no private cache across account changes.

- `GET /bootstrap` -> `{recipes: Recipe[], lists: GroceryList[]}` ordered newest first.
- `POST /recipes/approve` body `{recipe: RecipeInput, approved: true, requestId: UUID}` -> Recipe; explicit review/approval only.
- `PUT /recipes/:id` body `{recipe: RecipeInput}` -> Recipe.
- `DELETE /recipes/:id` -> `{ok: true}`; confirm destructive action.
- `POST /assistant` body `{messages: [{role:"user"|"assistant",content:string}], draft?: RecipeInput}` -> `{reply: string, draft: RecipeInput|null}`. Real AI; no automatic saves. Text chat only in this milestone, no fake voice button.
- `POST /groceries/preview` body `{selections:[{recipeId,servings}],inventory:[{name,amount,unit}]}` -> `{items: GroceryItem[], warnings:string[], fingerprint:string}`.
- `POST /groceries/approve` body `{name, selections, inventory, fingerprint, approved:true, requestId:UUID}` -> GroceryList. Send the preview's fingerprint; backend recomputes and rejects stale previews with 409. Disable approval with unresolved warnings.
- `PATCH /lists/:id/items/:itemId` body `{checked:boolean}` -> GroceryList.
- `DELETE /lists/:id` -> `{ok:true}`; confirm destructive action.

RecipeInput = `{title:string, description:string, servings:positive number, prepMinutes:number|null, cookMinutes:number|null, ingredients:[{name:string,amount:positive number,unit:string}], steps:string[], notes:string}`.
Required: title, servings, at least one complete ingredient, at least one method step. Unknown AI ingredient quantities must lead to questions, not invented amounts. Unit examples: g, kg, ml, l, count, tbsp, tsp. Do not coerce unknown amounts to zero.
Recipe = RecipeInput plus `{id:UUID,createdAt:ISO,updatedAt:ISO}`.
GroceryItem = `{id:UUID,name:string,amount:number,unit:string,checked:boolean}`.
GroceryList = `{id:UUID,name:string,createdAt:ISO,items:GroceryItem[],selections:[{recipeId,servings}],inventory:[{name,amount,unit}],warnings:string[]}`.

No image upload or voice implemented in this milestone; explain pending capabilities in Settings rather than render inert controls. Theme choice is a working device preference; account-level unit/diet/notification features are not yet implemented.
