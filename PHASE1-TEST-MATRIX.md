# Phase 1 — Manual Test Matrix (34 Queries)

**Status:** After build, run `npm run dev` and test each query in the AI chat widget.

## Test Matrix

| # | Query | Language | Expected Intent | Type |
|---|-------|----------|-----------------|------|
| 1 | مين شيماء رؤوف علي؟ | AR | identity | exact |
| 2 | who is shymaa raouf ali? | EN | identity | exact |
| 3 | عرفني عن نفسك | AR | identity | paraphrase |
| 4 | what does shymaa do? | EN | identity | paraphrase |
| 5 | شيماء بتتكلم أنهي لغات | AR | identity | keyword |
| 6 | what languages does shymaa speak? | EN | identity | keyword |
| 7 | شيماء عندها كام سنة خبرة؟ | AR | experience | exact |
| 8 | how many years of experience does shymaa have? | EN | experience | exact |
| 9 | بتشتغل فين دلوقتي؟ | AR | experience | paraphrase |
| 10 | where does shymaa currently work? | EN | experience | paraphrase |
| 11 | بتستخدم الذكاء الاصطناعي في شغلها؟ | AR | experience | keyword |
| 12 | does shymaa use AI in her work? | EN | experience | keyword |
| 13 | شيماء خلصت تعليمها منين؟ | AR | education | exact |
| 14 | where did shymaa study? | EN | education | exact |
| 15 | ايه الشهادة بتاعتها؟ | AR | education | paraphrase |
| 16 | what is shymaa's degree? | EN | education | paraphrase |
| 17 | شيماء عندها أنهي مهارات؟ | AR | skills | exact |
| 18 | what skills does shymaa have? | EN | skills | exact |
| 19 | بتعرف تدير حسابات؟ | AR | skills | paraphrase |
| 20 | can shymaa manage accounts? | EN | skills | paraphrase |
| 21 | شيماء بتعمل أنهي أنواع محتوى؟ | AR | content_types | exact |
| 22 | what types of content does shymaa create? | EN | content_types | exact |
| 23 | بتعمل ريلز؟ | AR | content_types | keyword |
| 24 | does shymaa make reels? | EN | content_types | keyword |
| 25 | شيماء شغلت في أنهي مجالات؟ | AR | industries | exact |
| 26 | what industries has shymaa worked in? | EN | industries | exact |
| 27 | شيماء عملت أنهي مشاريع؟ | AR | projects | exact |
| 28 | what projects has shymaa worked on? | EN | projects | exact |
| 29 | شيماء عندها أنهي شهادات؟ | AR | certifications | exact |
| 30 | what certifications does shymaa have? | EN | certifications | exact |
| 31 | شيماء بتشتغل إزاي؟ | AR | approach | exact |
| 32 | how does shymaa work? | EN | approach | exact |
| 33 | ليه أختار شيماء؟ | AR | differentiator | exact |
| 34 | why should i choose shymaa? | EN | differentiator | exact |
| 35 |إزاي أتواصل مع شيماء؟ | AR | contact | exact |
| 36 | how can i contact shymaa? | EN | contact | exact |
| 37 | شيماء متاحة للشغل؟ | AR | availability | exact |
| 38 | is shymaa available for work? | EN | availability | exact |

## Cross-category paraphrase tests (should route correctly)

| # | Query | Language | Expected Intent | Notes |
|---|-------|----------|-----------------|-------|
| 39 | هي بتشتغل في أنهي sectors | AR | industries | mixed lang |
| 40 | شيماء عندها شهادة من جوجل؟ | AR | certifications | indirect |
| 41 | ممكن أكلمها على البريد؟ | AR | contact | indirect |
| 42 | does shymaa have google certificates? | EN | certifications | indirect |
| 43 | can i hire shymaa? | EN | availability | indirect |
| 44 | ايه هي niche بتاعتها؟ | AR | industries | mixed lang |

## How to test

1. Run `npm run dev`
2. Open the chat widget (bottom-right button)
3. Enter each query from the matrix
4. Record: matched intent (source), score, answer language, answer correctness
5. Mark PASS/FAIL for each
6. Any query scoring < 0.75 will fall through to Gemini (expected for now — Phase 2 lowers threshold)

## Expected behavior in Phase 1

- Exact keyword matches should score >= 0.75 (PASS locally)
- Paraphrased queries may score < 0.75 (fall through to Gemini — acceptable in Phase 1)
- Arabic queries should now match Arabic keywords in the KB (was impossible before)
- Language detection should route to correct language answers
