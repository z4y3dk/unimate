const gradePoints: Record<string, number> = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
}

/** Minimal shape of an assignment needed for grade computation. */
export interface GradableAssignment {
  points_earned: number | null
  points_possible: number | null
}

/**
 * Converts a percentage (0-100) to a letter grade using the same scale
 * as gradePoints above.
 */
export function percentageToLetter(pct: number): string {
  if (pct >= 93) return 'A'
  if (pct >= 87) return 'B+'
  if (pct >= 80) return 'B'
  if (pct >= 77) return 'C+'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
}

/**
 * Computes a course's percentage grade (0-100) from the sum of
 * points_earned / points_possible across its graded assignments.
 * Returns null if no assignment has both fields set (i.e. nothing graded yet).
 */
export function calculateCoursePercentage(assignments: GradableAssignment[]): number | null {
  let earned = 0
  let possible = 0
  for (const a of assignments) {
    if (a.points_earned != null && a.points_possible != null && a.points_possible > 0) {
      earned += a.points_earned
      possible += a.points_possible
    }
  }
  if (possible === 0) return null
  return Math.round((earned / possible) * 1000) / 10
}

/**
 * Computes a course's letter grade. Prefers the real per-assignment
 * percentage when available; falls back to the course's manual `grade`
 * field for courses imported before per-assignment grading existed.
 */
export function calculateCourseGrade(
  assignments: GradableAssignment[],
  fallbackGrade?: string | null
): { letter: string | null; percentage: number | null; source: 'assignments' | 'manual' | 'none' } {
  const percentage = calculateCoursePercentage(assignments)
  if (percentage != null) {
    return { letter: percentageToLetter(percentage), percentage, source: 'assignments' }
  }
  if (fallbackGrade && fallbackGrade.trim()) {
    return { letter: fallbackGrade.trim().toUpperCase(), percentage: null, source: 'manual' }
  }
  return { letter: null, percentage: null, source: 'none' }
}

/**
 * Calculates overall GPA across courses. Each course may optionally include
 * its graded `assignments` — when present, the real per-assignment grade is
 * used instead of the manual `grade` field.
 */
export function calculateGPA(
  courses: { grade: string; credits: number; assignments?: GradableAssignment[] }[]
): number {
  if (courses.length === 0) return 0

  let totalPoints = 0
  let totalCredits = 0

  for (const course of courses) {
    const computed = calculateCourseGrade(course.assignments ?? [], course.grade)
    const letter = computed.letter ?? course.grade
    const points = gradePoints[(letter ?? '').trim().toUpperCase()] ?? 0
    totalPoints += points * course.credits
    totalCredits += course.credits
  }

  if (totalCredits === 0) return 0
  return Math.round((totalPoints / totalCredits) * 100) / 100
}
