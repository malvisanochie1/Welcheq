export function ageFromDateOfBirth(dateOfBirth: string | null, today = new Date()): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birth = new Date(dateOfBirth);
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  return today.getFullYear() - birth.getFullYear() - (hasHadBirthdayThisYear ? 0 : 1);
}
