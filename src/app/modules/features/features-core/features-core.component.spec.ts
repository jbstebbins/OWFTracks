import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesCoreComponent } from './features-core.component';

describe('FeaturesCoreComponent', () => {
  let component: FeaturesCoreComponent;
  let fixture: ComponentFixture<FeaturesCoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeaturesCoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
