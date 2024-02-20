import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlappingAnomalyComponent } from './overlapping-anomaly.component';

describe('OverlappingAnomalyComponent', () => {
  let component: OverlappingAnomalyComponent;
  let fixture: ComponentFixture<OverlappingAnomalyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverlappingAnomalyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlappingAnomalyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
