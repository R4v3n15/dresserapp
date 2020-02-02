// tslint:disable
import { NavParams, ModalController, LoadingController, AlertController, ToastController, IonSlides } from '@ionic/angular';
import { FileTransfer,  FileTransferObject } 	from '@ionic-native/file-transfer/ngx';
import { Component, OnInit, ViewChild } 		from '@angular/core';

import { File } 		from '@ionic-native/File/ngx';
import { Device } 		from '@ionic-native/device/ngx';
import { ApiService } 	from '../services/api.service';

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.page.html',
  styleUrls: ['./image-modal.page.scss'],
})
export class ImageModalPage implements OnInit {
	@ViewChild('slider', { static: true }) slider: IonSlides;
	index : number = 0;
	img	: any;
	uuid: any;
	loading: any;
	delete: boolean = false;
	public images 	= [];
	public isDownloading  : boolean = false;
	sliderConfig 	= {
						slidesPerView: 1.2,
						spaceBetween: 10,
						centeredSlides: true
					};
	
	constructor(
		private modalController: ModalController,
		private toastController: ToastController,
		private loadingCtrl: LoadingController,
		private alertCtrl: AlertController,
		private apiService: ApiService,
		private transfer: FileTransfer,
		private navParams: NavParams,
		private device: Device,
		private file: File,
	) { }

	ngOnInit() {
		this.img 	= this.navParams.get('image');
		this.uuid 	= this.navParams.get('uuid');
		this.images = this.navParams.get('images');
		this.index 	= this.navParams.get('indice');
		this.delete = this.uuid == this.device.uuid;

		this.slider.update().then(() => {
			this.slider.slideTo(this.index, 500);
		});
	}

	onSlideChange(){
		this.slider.getActiveIndex().then((indice) => {
			this.index = indice;
			this.img = this.images[indice];
		});
	}

	// D O W N L O A D   S E C T I O N
	downloadImage(imagePath) {
		this.loader();
		this.file.createDir(this.file.externalRootDirectory, 'mywedding', false).then((response) => {
			console.log('MKDIR: ', response);
		}).catch(err => {
			console.log('Could not create directory "mywedding" ',err);
		}); 
		this.saveImage(imagePath);
	}

	saveImage(picture){
		const currentName = picture.substr(picture.lastIndexOf('/') + 1);
		const fileTransfer: FileTransferObject = this.transfer.create();

		fileTransfer.download(encodeURI(picture), this.file.externalRootDirectory + '/mywedding/' + currentName).then(
			(entry) => {
				console.log('download complete: ' + entry.toURL());
				if(this.loading != undefined){
					this.loading.dismiss();
				}
				this.presentToast('Downloaded successfully.');
			},
			(error) => {
				console.log('FAIL: ', error);
			}
		);
	}

	// R E M O V E   P I C T U R E S
	async confirmDelete(picture){
		const alert = await this.alertCtrl.create({
						header: 'Delete Picture',
						message: 'Are you sure to delete this picture?',
						buttons: [ 
							{
								text: 'Cancel',
								role: 'cancel',
								cssClass: 'secondary',
								handler: () => {
									console.log('Confirm Cancel: blah');
								}
							},
							{
								text: 'Delete',
								handler: () => {
									this.loader();
									this.deletePicture(picture);
								}
							}
						]
					});
		await alert.present();
	}
	async deletePicture(picture){
		const currentName = picture.substr(picture.lastIndexOf('/') + 1);
		await this.apiService.deletePicture({'url': 'item/'+this.device.uuid+'/'+currentName+'/delete', 'file': currentName}).subscribe(
			(response) => {
				if(this.loading != undefined){
					this.loading.dismiss();
				}
				if(response['success']){
					this.images.splice(this.index, 1);
					this.slider.update().then(() => {
						if(this.images.length > 0){
							this.slider.slideNext().then(() => {
								this.slider.getActiveIndex().then((indice) => {
									this.index = indice;
									this.img   = this.images[this.index];
								});
							});
						} else {
							this.close();
						}
					})
				}
				this.presentToast(response['message']);
			},
			(error) => {
				console.log('Something went wrong.', error);
			}
		);
	}

	async loader(texto = 'Plase wait...') {
		this.loading = await this.loadingCtrl.create({
							message: texto,
						});
		await this.loading.present();
	}

	async presentToast(text) {
		const toast = await this.toastController.create({
						message: text,
						position: 'bottom',
						duration: 3000
					});
		toast.present();
	}

	close(){
		this.modalController.dismiss();
	}
}
