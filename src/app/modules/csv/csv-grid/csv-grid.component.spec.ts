import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvGridComponent } from './csv-grid.component';

describe('CsvGridComponent', () => {
  let component: CsvGridComponent;
  let fixture: ComponentFixture<CsvGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsvGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
