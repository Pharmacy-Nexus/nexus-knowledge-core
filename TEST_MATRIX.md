# VITAL v1.5 QA Matrix

| Test | Expected | Status |
|---|---|---|
| Existing user / login | Logs in as before | Requires live test |
| Existing owner profile | Same private data | Requires live test |
| Previous QR | Same URL and emergency publication | Requires live test |
| Family empty state | No demo/seeded people | Node unit verified, live pending |
| Create family profile | Stored only for authenticated owner | UI logic checked, Supabase RLS live pending |
| Edit family medical fields | Persists across sessions | UI logic checked, live pending |
| Consent attestation | Required checkbox at creation and editing | Unit verified, legal verification not implemented |
| Family document upload | Metadata includes family_profile_id | Source-level verified, live pending |
| Personal document list | Filters out family documents | Node unit verified, live pending |
| Family document list | Filters out own/other members' documents | Node unit verified, live pending |
| Cross-account isolation | No reads/writes for a different account | SQL RLS policy inspected, real API test pending |
| Delete member with documents | DB FK RESTRICT blocks deletion | SQL inspected, DB test pending |
| Public emergency route | No family private records | Unchanged public RPC, live pending |

No real medical data or seeded users are bundled.
