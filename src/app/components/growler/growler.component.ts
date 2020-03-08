import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-growler',
  templateUrl: './growler.component.html',
  styleUrls: ['./growler.component.css'],
  providers: [MessageService]
})
export class GrowlerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private messageService: MessageService) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      console.log(params);

      if (params.hasOwnProperty('severity')) {
        this.messageService.add({ severity: params.severity, summary: params.title, detail: params.message });
      }
    });
  }

}
