import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesGridComponent } from './features-grid.component';

describe('FeaturesGridComponent', () => {
  let component: FeaturesGridComponent;
  let fixture: ComponentFixture<FeaturesGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeaturesGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
