import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiptypeAnomalyComponent } from './shiptype-anomaly.component';

describe('ShiptypeAnomalyComponent', () => {
  let component: ShiptypeAnomalyComponent;
  let fixture: ComponentFixture<ShiptypeAnomalyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShiptypeAnomalyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiptypeAnomalyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
