# Contributing

## The one rule: only redistributable text

This repository is public, and everything in `content/` is served to anyone. A pack's `## Text` sections must come from a source that may be redistributed:

- **Public domain.** For example, translations published before 1930 (US), such as Legge's 1891 Tao Te Ching from Project Gutenberg.
- **Openly licensed.** CC BY, CC BY-SA or similar. Record the license and attribution in `pack.json`.
- **Your own writing.**

Modern books, including most well-known modern translations and adaptations, are copyrighted. Do not paste their text, and do not closely paraphrase it chapter by chapter. A modern book can be named under `further_reading` and cited by chapter number. Commentary (`## Reflection`, `## Question`, `## Practice`) must be your own words.

## Writing commentary for an entry

Add any of these sections below `## Text` in `content/<book>/entries/NN.md`:

```markdown
## Reflection

What the passage means for someone leading a group today: 80–150 words, plain language,
grounded in the text above it. Quote the source translation exactly, or not at all.

## Question

One question the reader can sit with.

## Practice

One small, concrete thing to try this week.
```

An entry without a reflection still works. The tools return the text and ask the model to interpret it directly. Tests require that any entry with a reflection also has a question and a practice.

## Adding a book

1. Create `content/<book-id>/pack.json`. Copy `content/tao-of-leadership/pack.json` and change it:
   - `id` must match the folder name.
   - `unit` is what one entry is called: `"chapter"`, `"card"`, `"verse"` and so on.
   - `sources` lists every source, with its license and which sections it covers.
   - `spreads` maps a spread id to named positions. A spread can't have more positions than the book has entries.
   - `personas` holds voice guidelines for interpreting readings, and `default_persona` names which one to use by default.
2. Add `content/<book-id>/entries/NN.md`, one file per entry:

   ```markdown
   ---
   number: 1
   title: A Short Title
   themes: [theme-one, theme-two]
   ---

   ## Text

   The source text.
   ```

3. Run `npm test` and `npm run dev`, then `npm run smoke`. Once more than one book is installed, tools need a `book` argument.

`scripts/import-legge.py` shows how the Tao text was split out of the Gutenberg file, in case a similar import helps with another book.
