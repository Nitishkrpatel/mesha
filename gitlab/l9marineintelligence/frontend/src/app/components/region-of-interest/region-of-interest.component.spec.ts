import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionOfInterestComponent } from './region-of-interest.component';

describe('RegionOfInterestComponent', () => {
  let component: RegionOfInterestComponent;
  let fixture: ComponentFixture<RegionOfInterestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegionOfInterestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegionOfInterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
