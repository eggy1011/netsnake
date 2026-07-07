import { COURSE_PACKS } from "../courses/courseRegistry";
import type { ProgressMap } from "../types/questions";
import { computeCourseStats } from "../questions/questionProgress";
import CourseCard from "./CourseCard";

type Props = {
  progress: ProgressMap;
  selectedCourseId: string;
  onSelect: (courseId: string) => void;
  onViewSources: (courseId: string) => void;
};

export default function CourseLibrary({
  progress,
  selectedCourseId,
  onSelect,
  onViewSources,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {COURSE_PACKS.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          stats={computeCourseStats(course, progress)}
          selected={course.id === selectedCourseId}
          onSelect={() => onSelect(course.id)}
          onViewSources={() => onViewSources(course.id)}
        />
      ))}
    </div>
  );
}
