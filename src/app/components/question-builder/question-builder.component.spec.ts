import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionBuilderComponent } from './question-builder.component';

describe('QuestionBuilderComponent', () => {
  let component: QuestionBuilderComponent;
  let fixture: ComponentFixture<QuestionBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
