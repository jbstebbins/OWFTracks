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
      if (params.hasOwnProperty('type')) {
        this.messageService.add({ severity: 'success', summary: 'info', detail: params['message'] });
      }
    });
  }

}
