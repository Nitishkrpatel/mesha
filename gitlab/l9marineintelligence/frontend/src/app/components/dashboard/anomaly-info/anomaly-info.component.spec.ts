import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomalyInfoComponent } from './anomaly-info.component';

describe('AnomalyInfoComponent', () => {
  let component: AnomalyInfoComponent;
  let fixture: ComponentFixture<AnomalyInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnomalyInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnomalyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
