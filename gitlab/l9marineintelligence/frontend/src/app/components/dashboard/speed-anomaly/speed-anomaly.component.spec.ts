import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeedAnomalyComponent } from './speed-anomaly.component';

describe('SpeedAnomalyComponent', () => {
  let component: SpeedAnomalyComponent;
  let fixture: ComponentFixture<SpeedAnomalyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpeedAnomalyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeedAnomalyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
