import { MenuItem } from 'primeng/api';

export class MenuModel {
    items: MenuItem[];

    constructor() {
        this.items = [{
            label: 'Service',
            icon: 'pi pi-fw pi-paperclip',
            items: [{
                label: 'Connect CSV',
                icon: 'pi pi-fw pi-info',
                command: null
            },
            {
                label: 'Connect REST',
                icon: 'pi pi-fw pi-list',
                command: null
            },
            {
                label: 'Connect Stream',
                icon: 'pi pi-fw pi-list',
                command: null
            }
            ]
        },
        {
            label: 'Help',
            icon: 'pi pi-fw pi-question',
            items: [{
                label: 'About',
                icon: 'pi pi-fw pi-info',
                command: null
            }
            ]
        }
        ];
    }
}
