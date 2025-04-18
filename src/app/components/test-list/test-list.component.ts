import { Component } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClassroomService } from '../../../services/classroom.service';
import { TestService } from '../../../services/test.service';
import { AuthService } from '../../../services/auth.service';
import { TestData, Result } from '../../../models/test.model';
import { ClassroomData } from '../../../models/classroom.model';
import { UserData } from '../../../models/user.model';
import { Subscription } from 'rxjs';
import test from 'node:test';

@Component({
  selector: 'app-test-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-list.component.html',
  styleUrls: ['./test-list.component.css'],
})
export class TestListComponent {
  classroomId: string = '';
  classroom: ClassroomData | null = null;
  tests: TestData[] = [];
  userRole: 'teacher' | 'student' | null = null;
  studentResults: { [testId: string]: Result | null } = {};
  dropdownOpen: { [key: string]: boolean } = {};
  currentUserId: string = '';
  showNotFoundError: boolean = false;
  private routerSubscription!: Subscription;
  private user: UserData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classroomService: ClassroomService,
    private testService: TestService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe({
      next: (user) => {
        this.user = user;
        if (!this.user) {
          this.router.navigate(['/login']);
        }
      },
      error: (err) => console.error('Error fetching user:', err)
    });
    this.testService.setTest(null);
    this.classroom = this.classroomService.getClassroom();

    if (!this.classroom) {
      this.route.paramMap.subscribe((params) => {
        this.classroomId = params.get('classroomId') || '';

        this.classroomService.getClassroomById(this.classroomId).subscribe((classroom) => {
          this.classroom = classroom;

          if (!this.classroom) {
            this.showNotFoundError = true;
          } else {
            this.classroomService.setClassroom(this.classroom);
            this.loadUserData();
          }
        });
      });
    } else {
      this.loadUserData();
    }

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (
          !event.url.includes('/test-list/' + this.classroomId) && 
          !event.url.includes('/teacher-result') && 
          !event.url.includes('/attempt-test') &&
          !event.url.includes('/question-builder') && 
          !event.url.includes('/test-details')
        ) {
          this.classroomService.setClassroom(null);
        }
      }
    });
  }

  private loadUserData(): void {
    this.authService.getUser().subscribe((user) => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.currentUserId = user.userId;
        this.loadData(user.userId);
      }
    });
  }

  private loadData(userId: string): void {
    this.testService.getTestsForClassroom(this.classroom!.classroomId).subscribe(
      (tests) => {
        this.tests = tests;
  
        this.userRole = this.classroom?.teacherId === userId ? 'teacher' : 'student';
  
        if (this.userRole === 'student') {
          this.tests.forEach((test) => {
            if (!test.testId) return;
  
            const resultsArray = Array.isArray(test.result) ? test.result : [];
            const result = resultsArray.find((r) => r.studentId === userId) || null;
            this.studentResults[test.testId] = result ? result.result ? result : null : null;
          });
        }
      },
      (error) => {
        this.tests = [];
      }
    );
  }
  
  goBack(): void {
    this.router.navigate(['/classroom-list']);
  }

  isTestActive(startTime: Date, deadlineTime: Date): boolean {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const deadline = new Date(deadlineTime).getTime();
    return now >= start && now <= deadline;
  }

  navigateToQuestionBuilder(): void {
    if (this.userRole === 'teacher') {
      this.router.navigate(['/question-builder', this.classroom!.classroomId]);
    }
  }

  startTest(test: TestData): void {
    this.testService.setTest(test);
    this.router.navigate(['/attempt-test', this.classroom!.classroomId, test.testId]);
  }

  deleteTest(testId: string): void {
    if (this.userRole === 'teacher') {
      this.testService.deleteTest(testId, this.user!.userId).subscribe({
        next: () => {
          this.tests = this.tests.filter(test => test.testId !== testId);
        },
        error: (err) => {
          alert(err);
        }
      });
    }
  }

  editTest(test: TestData): void {
    this.testService.setTest(test);
    this.router.navigate(['/question-builder', this.classroom!.classroomId, test.testId]);
  }

  viewResults(test: TestData): void {
    if (this.userRole === 'teacher') {
      this.classroomService.setClassroom(this.classroom!);
      this.testService.setTest(test);
      this.router.navigate(['/teacher-result', test.testId], {
        queryParams: { classroomId: this.classroom!.classroomId },
      });
    }
  }

  toggleDropdown(testId: string, event: Event): void {
    event.stopPropagation();
    this.dropdownOpen[testId] = !this.dropdownOpen[testId];
  }
}
