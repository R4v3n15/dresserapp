// tslint:disable
import { ActionSheetController, ToastController, LoadingController, Platform, AlertController, ModalController, IonSlides } from '@ionic/angular';
import { Component, OnInit, ViewChild, ChangeDetectorRef, NgZone, ElementRef} from '@angular/core';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { Camera, CameraOptions } 			from '@ionic-native/Camera/ngx';
import { File, FileEntry } 					from '@ionic-native/File/ngx';
import { ImagePicker } 						from '@ionic-native/image-picker/ngx';
import { ApiService } 						from '../services/api.service';
import { FilePath } 						from '@ionic-native/file-path/ngx';
import { WebView } 							from '@ionic-native/ionic-webview/ngx';
import { Storage } 							from '@ionic/storage';
import { Router } 							from '@angular/router';
import { Device } 							from '@ionic-native/device/ngx';
import { ImageModalPage } 					from '../image-modal/image-modal.page';
import { GalleryPage } 						from '../gallery/gallery.page';

const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
	@ViewChild('polos', { static: true }) polos: ElementRef;
	@ViewChild('pants', { static: true }) pants: IonSlides;
	@ViewChild('shoes', { static: true }) shoes: IonSlides;
	@ViewChild('favoritos', { static: true }) favoritos: IonSlides;
	loading: any;
	options: any;
	colected: any = [];
	category: any = '';

	// Uploads
	polos_collection: any = [];
	pants_collection: any = [];
	shoes_collection: any = [];
	favos_collection: any = [];

	// Index Selected
	polo_index: number = 0;
	pant_index: number = 0;
	shoe_index: number = 0;
	// Selected
	polo_active: number = 0;
	pant_active: number = 0;
	shoe_active: number = 0;
	favo_active: number = 0;

	sliderConfig 	= {
		slidesPerView: 1.3,
		spaceBetween: 4,
		centeredSlides: true
	};

	favsConfig 	= {
		slidesPerView: 1.2,
		spaceBetween: 4,
		centeredSlides: true
	};

	slideConfig 	= {
		slidesPerView: 1.2,
		slidesPerColumn: 4,
		spaceBetween: 1,
		centeredSlides: true
	};

	public title = 'Bride & Groom';
	public progress     : number = 0;
	public percentage   : number = 0;
	public images 		= [];
	public collection 	= [];
	public galleryType 	= 'add';
	public imageSection = 'add';
	public isUploading  : boolean = false;
	public isDownloading  : boolean = false;

	constructor(
		private actionSheetController: ActionSheetController,
		private toastController: ToastController,
		private loadingCtrl: LoadingController,
		private modalCtrl: ModalController,
		private alertCtrl: AlertController,
		private imagePicker: ImagePicker,
		private apiService: ApiService,
		private ref: ChangeDetectorRef,
		private transfer: FileTransfer,
		private filePath: FilePath,
		private platform: Platform,
		private webview: WebView,
		private storage: Storage,
		private camera: Camera,
		private router: Router,
		private zone: NgZone,
		private device: Device,
		private file: File,
	) {}

  	ngOnInit() {
		this.platform.ready().then(() => {
			this.storage.get('userData').then((credentials: any) => {
				this.title = credentials.name;
			});

			this.loadStoredImages();
		});
	}

	// COMBINAR
	onPolosChange(slidePolos: IonSlides){
		slidePolos.getActiveIndex().then((indice) => {
			this.polo_index = indice;
		});
	}

	onPantsChange(slidePants: IonSlides){
		slidePants.getActiveIndex().then((indice) => {
			this.pant_index = indice;
		});
	}

	onShoesChange(slideShoes: IonSlides){
		slideShoes.getActiveIndex().then((indice) => {
			this.shoe_index = indice;
		});
	}

	saveCollection(){
		this.loader();
		this.storage.get('userData').then((credentials: any) => {
			this.polo_active = this.polos_collection[this.polo_index].idPicture;
			this.pant_active = this.pants_collection[this.pant_index].idPicture;
			this.shoe_active = this.shoes_collection[this.shoe_index].idPicture;

			let params = {polo: this.polo_active, pant: this.pant_active, shoe: this.shoe_active, user: credentials.id};
			this.apiService.saveCollection({'url': 'new_collection', data: params }).subscribe((response: any) => {
				console.log('SAVE:', response);
				setTimeout(() => {
					this.loading.dismiss();
					this.presentToast(response.message);
				}, 1000);
			});
		});
	}

	async deleteCollection(){
		const alert = await this.alertCtrl.create({
						message: 'Eliminar conjunto de mis favoritos',
						buttons: [
							{
								text: 'Cancelar',
								role: 'cancel',
								cssClass: 'secondary',
								handler: () => {
									console.log('Naah');
								}
							}, 
							{
								text: 'Eliminar',
								cssClass: 'danger',
								handler: () => {
									this.loader();
									this.storage.get('userData').then((credentials: any) => {
										let conjunto = this.collection[this.favo_active].idConjunto;
										let params = {collection: conjunto, user: credentials.id};
										this.apiService.deleteCollection({'url': 'delete/collection', data: params }).subscribe((response: any) => {
											if(response.success){
												this.loading.dismiss();
												this.retrieveCollection('get_collection');
											}
										});
									});
								}
							}
						]
					});
			await alert.present();

	}

	// FAVORITOS
	onFavoritosChange(slidesFavoritos: IonSlides){
		slidesFavoritos.getActiveIndex().then((indice) => {
			console.log(indice);
			this.favo_active = indice;
		});
	}

	
	async openPreview(img, uuid, files, index){
		const modal = await this.modalCtrl.create({
							component: ImageModalPage,
							componentProps: {
								'img': img,
								'uuid': uuid,
								'images': this.collection,
								'files': files,
								'indice': index
							}
						});
		return await modal.present();
	}

	async openGallery(uuid, files, username){
		if(files.length < 1){
			this.presentToast('Gallery without pictures.');
			return;
		}
		const modal = await this.modalCtrl.create({
							component: GalleryPage,
							componentProps: {
								'uuid': uuid,
								'images': files,
								'user': username
							}
						});
		return await modal.present();
	}

	segmentChanged(event){
		if(event.detail.value == 'combinar'){
			this.retrieveCollection('collection');
		}

		if(event.detail.value == 'favorito'){
			this.retrieveCollection('get_collection');
		}

		if(event.detail.value == 'add'){
			this.imageSection = 'add';
		}
	}

	onViewChanged(event){
		if(event.detail.value == 'gallery' ){
			this.retrieveCollection('collection');
		}
		this.galleryType = event.detail.value;
	}

	retrieveCollection(_url){
		this.loader();
		this.storage.get('userData').then((credentials: any) => {
			this.apiService.getCollection({'url': _url, user: credentials.id }).subscribe((response) => {
				if(response['success']){
					if(_url == 'collection'){
						this.polos_collection = response['polos'];
						this.pants_collection = response['pants'];
						this.shoes_collection = response['shoes'];
					} else {
						this.collection = response['collection'];
						this.favos_collection = response['images']
					}
					this.loading.dismiss();
				}
			});
		});
	}
  
  	loadStoredImages() {
		this.storage.get(STORAGE_KEY).then((images) => {
			if (images && images.length > 0) {
				console.log('===| IMAGES STORAGE: ', images);
				this.images = JSON.parse(images);
				this.ref.detectChanges();
			}
		});
	}

	pathForImage(img) {
		if (img === null) {
		  	return '';
		} else {
		  	const converted = this.webview.convertFileSrc(img);
		  	return converted;
		}
	}

	async presentToast(text) {
		const toast = await this.toastController.create({
						message: text,
						position: 'bottom',
						duration: 3000
					});
		toast.present();
	}

	async selectImage() {
		const actionSheet = await this.actionSheetController.create({
								header: "Select Image source",
								buttons: [{
										text: 'From Library',
										handler: () => {
											this.selectImages();
										}
									},
									{
										text: 'Use Camera',
										handler: () => {
											this.takePicture();
										}
									},
									{
										text: 'Cancel',
										role: 'cancel'
									}
								]
							});
		await actionSheet.present();
	}

	selectImages() {
		this.imagePicker.hasReadPermission().then((allowed) => {
			console.log(allowed);
			this.imagePicker.getPictures({}).then(
				(results) => {
					this.saveImages(results);
				}, 
				(err) => {
					alert(err);
				}
			);
		})
	}

	saveImages(sources) {
		sources.map(async (imagePath) => {
			var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
			var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
			var timeStamp 	= new Date(),
			fileNamme 	= timeStamp.getTime()+".jpg";

			if(this.platform.is("ios")){
				if(correctPath.indexOf('file://') == -1){
					correctPath = 'file://' + correctPath;
				}
			}
			
			await this.file.copyFile(correctPath, currentName, this.file.dataDirectory, fileNamme).then(async (success) => {
					let filePath = this.file.dataDirectory + fileNamme;
					let resPath  = this.webview.convertFileSrc(filePath);
			
					let newEntry = { name: fileNamme, path: resPath, filePath: filePath };
			
					this.images = [newEntry, ...this.images];
					await this.storage.set(STORAGE_KEY, JSON.stringify(this.images));
					this.ref.detectChanges();
				},
				(error) => {
					console.log(error);
					this.presentToast(error.code == 1 ? 'File not found!' : 'Error while storing file.');
				}
			);
		});
	}

	processImages(sources) {
		sources.forEach(async (imagePath) => {
			var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
			var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
			var timeStamp 	= new Date(),
				fileNamme 	= timeStamp.getTime();
			await this.copyFileToLocalDir(correctPath, currentName, fileNamme + ".jpg");
		});
	}

	takePicture() {
		var options: CameraOptions = {
						quality: 50,
						sourceType: this.camera.PictureSourceType.CAMERA,
						saveToPhotoAlbum: false,
						correctOrientation: true
					};

		this.camera.getPicture(options).then(imagePath => {
			var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
			var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
			var timeStamp 	= new Date(),
				fileNamme 	= timeStamp.getTime()+".jpg";
			this.file.copyFile(correctPath, currentName, this.file.dataDirectory, fileNamme).then(async (success) => {
					let filePath = this.file.dataDirectory + fileNamme;
					let resPath  = this.webview.convertFileSrc(filePath);
			
					let newEntry = { name: fileNamme, path: resPath, filePath: filePath };
			
					this.images = [newEntry, ...this.images];
					await this.storage.set(STORAGE_KEY, JSON.stringify(this.images));
					this.ref.detectChanges();
				},
				(error) => {
					this.presentToast('Error al almacenar el archivo.');
				}
			);
		});
	}

	copyFileToLocalDir(namePath, currentName, newFileName) {
		this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then((success) => {
			this.updateStoredImages(newFileName);
		},
		(error) => {
			console.log(error);
			this.presentToast('Error al almacenar el archivo.');
		});
	}

	updateStoredImages(name) {
		this.storage.get(STORAGE_KEY).then(images => {
			let arr = JSON.parse(images);
			if (!arr) {
				let newImages = [name];
				this.storage.set(STORAGE_KEY, JSON.stringify(newImages));
			} else {
				arr.push(name);
				this.storage.set(STORAGE_KEY, JSON.stringify(arr));
			}
	 
			let filePath = this.file.dataDirectory + name;
			let resPath = this.pathForImage(filePath);
	 
			let newEntry = {
							name: name,
							path: resPath,
							filePath: filePath
						};
	 
			this.images = [newEntry, ...this.images];
			this.ref.detectChanges(); // trigger change detection cycle
			// this.startUpload(newEntry, this.images.length - 1);
		});
	}

	deleteImage(position) {
		this.images.splice(position, 1);
		this.storage.set(STORAGE_KEY, this.images);
	}

	// U P L U A D   S E C T I O N

	uploadAll(){
		this.storage.get(STORAGE_KEY).then(images => {
			if (images) {
				const pictures = JSON.parse(images);
				pictures.map((picture, i) => {
					setTimeout( async () => {
						await this.startUpload(picture, i, this.category);
					}, 3000);
				});
			}
		});
	}

	startUpload(imgEntry, index, category) {
		this.isUploading = true;
		this.file.resolveLocalFilesystemUrl(imgEntry.filePath)
			.then(entry => {
				( < FileEntry > entry).file(file => this.readFile(file, index, category))
			})
			.catch(err => {
				this.presentToast('Error while reading file.');
			});
	}

	readFile(file: any, index, category) {
		const reader = new FileReader();
		reader.onloadend = () => {
			const formData = new FormData();
			const imgBlob = new Blob([reader.result], {
								type: file.type
							});
			formData.append('picture', imgBlob, file.name);
			formData.append('folder', this.device.uuid);
			formData.append('category', category);
			this.storage.get('userData').then((credentials: any) => {
				formData.append('user', credentials.id);
				this.uploadToServer(formData, index);
			});
		};
		reader.readAsArrayBuffer(file);
	}

	uploadToServer(formData: FormData, index) {
		this.apiService.resetProgress();
		this.apiService.uploadProgress.subscribe((progress) => {
			this.zone.run(() => {
				this.progress = progress;
			});
		});

		this.apiService.uploadPicture({'url': 'upload', 'formData': formData}).subscribe((response) => {
			if (response['success'] || 'Done') {
				this.removeImage(index);
				this.isUploading = this.images.length > 0;
				this.progress 	 = 0;
				this.presentToast('File upload complete.');
				this.ref.detectChanges();
			} else {
				this.presentToast('File upload failed.');
			}
		});
	}

	// A C T I O N
	async chooseCategory(image, index) {
		const alert = await this.alertCtrl.create({
						header: 'seleccionar Categoría',
						inputs: [
							{
								label: 'Polos',
								name: 'polos',
								type: 'radio',
								value: 'polos'
							},
							{
								label: 'Pantalon',
								name: 'pantalones',
								type: 'radio',
								value: 'pantalones'
							},
							{
								label: 'Zapatos',
								name: 'zapatos',
								type: 'radio',
								value: 'zapatos'
							},
						],
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
								text: 'Guardar',
								handler: (data) => {
									this.category = data; // Esta demás
									this.startUpload(image, index, data);
								}
							}
						]
					});
		await alert.present();
	}

	// D O W N L O A D   S E C T I O N

	downloadImage(imagePath) {
		this.loader();
		this.file.createDir(this.file.externalRootDirectory, 'smertdresser', false).then((response) => {
			console.log('MKDIR: ', response);
		}).catch(err => {
			console.log('Could not create directory "smertdresser" ',err);
		}); 
		this.saveImage(imagePath);
	}

	saveImage(picture){
		this.isDownloading = true;
		const currentName = picture.substr(picture.lastIndexOf('/') + 1);
		const fileTransfer: FileTransferObject = this.transfer.create();

		fileTransfer.download(encodeURI(picture), this.file.externalRootDirectory + '/smertdresser/' + currentName).then(
			(entry) => {
				console.log('download complete: ' + entry.toURL());
				this.isDownloading = false;
				this.percentage = 0;
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

	async loader(texto = 'Plase wait...') {
		this.loading = await this.loadingCtrl.create({
							message: texto,
						});
		await this.loading.present();
	}

	// R E M O V E   P I C T U R E S
	removeImage(position) {
		this.zone.run(() => {
			this.images.splice(position, 1);
			this.isUploading = this.images.length > 0;
			this.storage.set(STORAGE_KEY, this.images);
		});
	}

	async deletePicture(picture){
		const alert = await this.alertCtrl.create({
						message: 'Eliminar prenda de galería.',
						buttons: [
							{
								text: 'Cancelar',
								role: 'cancel',
								cssClass: 'secondary',
								handler: () => {
									console.log('Naah');
								}
							}, 
							{
								text: 'Eliminar',
								cssClass: 'danger',
								handler: () => {
									this.loader();
									this.apiService.deletePicture({'url': 'delete/image', 'data': picture}).subscribe(
										(response: any) => {
											if(response.success){
												this.retrieveCollection('collection');
											}
											this.loading.dismiss();
										},
										(error) => {
											console.log('Something went wrong.', error);
										}
									);
								}
							}
						]
					});
			await alert.present();
	}

	// L O G O U T
	async logout(){
		const alert = await this.alertCtrl.create({
						message: '¿Estás seguro de cerrar sesión?',
						buttons: [
							{
								text: 'Log Out',
								handler: () => {
									this.storage.remove(STORAGE_KEY);
									this.storage.remove('username');
									this.router.navigate(['/login']);
								}
							}, 
							{
								text: 'Cancel',
								role: 'cancel',
								cssClass: 'secondary',
								handler: () => {
									console.log('Confirm Cancel: blah');
								}
							}
						]
					});
		await alert.present();
	}
}
