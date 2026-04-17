# Lessons Learned

2026-03-16, failed to account for email collisions during user creation/upsert causing P2002 error, learned that using upsert on firebaseUid will fail if the email is already in the database under a different id, Always add an update fallback finding the user by email when a P2002 constraint error happens during auth onboarding