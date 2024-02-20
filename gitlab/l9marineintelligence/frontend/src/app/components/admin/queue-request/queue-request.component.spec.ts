import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueRequestComponent } from './queue-request.component';

describe('QueueRequestComponent', () => {
  let component: QueueRequestComponent;
  let fixture: ComponentFixture<QueueRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QueueRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueueRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
