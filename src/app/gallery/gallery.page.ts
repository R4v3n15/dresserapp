// tslint:disable
import { ModalController, NavParams } 	from '@ionic/angular';
import { Component, OnInit } 			from '@angular/core';

import { ImageModalPage } 				from '../image-modal/image-modal.page';

@Component({
    selector: 'app-gallery',
    templateUrl: './gallery.page.html',
    styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage implements OnInit {
    name 	: string = 'Visitor';
	images 	: any = [];
	uuid	: string = '';

    constructor(
		private modalCtrl: ModalController,
		private params: NavParams
	) { 
		this.name = this.params.get('user');
		this.uuid = this.params.get('uuid');
		this.images = this.params.get('images');
	}

    ngOnInit() {
	}
	
	async openPreview(index, image){
		const modal = await this.modalCtrl.create({
							component: ImageModalPage,
							componentProps: {
								'uuid': this.uuid,
								'image': image,
								'images': this.images,
								'indice': index
							}
						});
		return await modal.present();
	}

	closeModal() {
		this.modalCtrl.dismiss();
	}
}
