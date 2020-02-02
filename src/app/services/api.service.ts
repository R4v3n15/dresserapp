// tslint:disable
import { HttpClient, HttpHeaders, HttpRequest, HttpEventType } from '@angular/common/http';
import { LoadingController, ToastController } from '@ionic/angular';
import { BehaviorSubject } 	from 'rxjs';
import { map, tap, last } 	from 'rxjs/operators';
import { Injectable,} 		from '@angular/core';
import { Storage } 			from '@ionic/storage';
import { Device } 			from '@ionic-native/device/ngx';
import { Router } 			from '@angular/router';

const _URL_ : String = 'https://www.apirest.potokapp.com/';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
	public uploadProgress  	: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	public downloadProgress	: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	  
	loading: any;
	constructor(
		private loadingCtrl: LoadingController,
		private toastCtrl: ToastController,
		private storage: Storage,
		private http: HttpClient,
		private device: Device,
		private router: Router,
	) { }

	/**
	|--------------------------------------------------------------------------------------------
	| A U T H E N T I C A T I O N
	|--------------------------------------------------------------------------------------------
	*/
	authenticateUser(data) {
		console.log(data);
		let string 			= data.username+':'+this.device.uuid;
		let encodedString 	= btoa(string);
		let headers = new HttpHeaders().set('Content-Type', 'application/json')
										.set('Authorization', 'Basic '+encodedString);

		return this.http.post(_URL_ + data.url, { username: data.username, uuid: this.device.uuid, password: data.password }, {headers});
	}

	registerUser(data) {
		console.log(data);
		let headers = new HttpHeaders().set('Content-Type', 'application/json');
		return this.http.post(_URL_ + data.url, data, {headers});
	}

	logoutUser(){
		this.storage.remove('');
		this.storage.remove('username');
		this.router.navigate(['login']);
	}


	/**
	|--------------------------------------------------------------------------------------------
	| G A L L E R Y   M A N A G E R
	|--------------------------------------------------------------------------------------------
	*/
	uploadPicture(data) {
		var formData: FormData = data.formData;
		let params = new HttpRequest('POST', data.url, formData, { 
						responseType: 'arraybuffer',
						reportProgress: true
					});

		return this.http.request(params).pipe(
				map(event => this.getStatusUpload(event)),
				tap(message => console.log(message) ),
				last()
			);
	}

	getCollection(data) {
		let headers = new HttpHeaders().set('Content-Type', 'application/json');
		return this.http.post(data.url, {}, {headers});
		// return this.http.post(_URL_+'collection/'+this.device.uuid, {}, {headers});
	}


	useCollection(formData: FormData) {
		let params = new HttpRequest('POST', _URL_+'collection/'+this.device.uuid, formData, { 
						responseType: 'arraybuffer',
						reportProgress: true
					});

		return this.http.request(params).pipe(
				map(event => this.getStatusUpload(event)),
				tap(message => console.log(message) ),
				last()
			);
	}

	deletePicture(data) {
		let headers = new HttpHeaders().set('Content-Type', 'application/json');
		return this.http.post(data.url, {}, {headers});
	}




	getStatusUpload(event){
		let status;
		switch(event.type){
		  case HttpEventType.Sent:
			return `Uploading Files`;
		  
		  case HttpEventType.UploadProgress:
			status = Math.round(100 * event.loaded / event.total);
			this.uploadProgress.next(status);
			return `File are ${status}% uploaded`;
	
		  case HttpEventType.Response:
			return `Done`;
	
		  default:
			return ``
		}
	}
	getStatusDownload(event){

		let status;
	
		switch(event.type){
		  case HttpEventType.Sent:
			return `Uploading Files`;
		
		  case HttpEventType.DownloadProgress:
			status = Math.round(100 * event.loaded / event.total);
			this.downloadProgress.next(status); // NOTE: The Content-Length header must be set on the server to calculate this
			return `Files are ${status}% downloaded`; 
	
		  case HttpEventType.Response:
			return `Done`;
	
		  default:
			return ``
		}
	}
	resetProgress(){
		this.uploadProgress.next(0);
		this.downloadProgress.next(0);
	}

	/**
	|--------------------------------------------------------------------------------------------
	| H E L P E R S
	|--------------------------------------------------------------------------------------------
	*/

    async loader(texto = 'Uploading image...') {
      this.loading = await this.loadingCtrl.create({
                        message: texto,
                      });
      await this.loading.present();
    }
  

    async presentToast(text) {
      const toast = await this.toastCtrl.create({
                      message: text,
                      position: 'bottom',
                      duration: 3000
                    });
      toast.present();
	}
}
