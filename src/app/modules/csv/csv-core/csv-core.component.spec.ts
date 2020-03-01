import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvCoreComponent } from './csv-core.component';

describe('CsvCoreComponent', () => {
  let component: CsvCoreComponent;
  let fixture: ComponentFixture<CsvCoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsvCoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
