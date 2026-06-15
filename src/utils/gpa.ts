const gradePoints: Record<string, number> = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
}

export function calculateGPA(courses: { grade: string; credits: number }[]): number {
  if (courses.length === 0) return 0

  let totalPoints = 0
  let totalCredits = 0

  for (const course of courses) {
    const points = gradePoints[course.grade.trim().toUpperCase()] ?? 0
    totalPoints += points * course.credits
    totalCredits += course.credits
  }

  if (totalCredits === 0) return 0
  return Math.round((totalPoints / totalCredits) * 100) / 100
}
