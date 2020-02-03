// tslint:disable
import { AlertController, LoadingController } from '@ionic/angular';
import { finalize, timeout } 				  from 'rxjs/operators';
import { Component, OnInit }                  from '@angular/core';
import { Storage }                            from '@ionic/storage';
import { Router }                             from '@angular/router';

import { ApiService }                         from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
	username = '';
	password = '';
	constructor(
		private loadingCtrl: LoadingController,
		private alertCtrl: AlertController,
		private apiService: ApiService,
		private storage: Storage,
		private router: Router,
	) { }

	ngOnInit() {
		// Something TODO here
	}

	async authUser() {
		if (this.password  && this.username && this.username.length > 3 && this.password.length > 3) {
			let loader = await this.loadingCtrl.create({
							message: 'Por favor espere...',
						});
			await loader.present();

			this.apiService.authenticateUser({'url': 'login', 'username': this.username, 'password': this.password })
			.pipe(
				timeout(8000),
				finalize(() => { loader.dismiss(); })
			)
			.subscribe(
				(response: any) => {
					if(response.success){
						this.storage.set('userData', response.credentials);
						this.router.navigate(['/home'], {replaceUrl: true});
					} else {
						if(response.type == 'object'){
							this.alertError('Error', response.message[0]);
						} else {
							this.alertError('Error', response.message);
						}
					}
				},
				(fail) => {
					console.log(fail);
					loader.dismiss();
					this.alertError('Error de tiempo de espera', 'Por favor verifique su conexión Wifi.');
				}
			);
		} else {
			this.alertError('Error', 'Proporcione un nombre de usuario y contraseña válidos para continuar.');
		}
	}

	async alertError(title, message) {
		const alert = await this.alertCtrl.create({
						header: title,
						message,
						buttons: ['OK']
					});

		await alert.present();
	}

	wellcomePage(){
        this.router.navigate(['/wellcome'], {replaceUrl: true});
	}
	
	registerPage(){
        this.router.navigate(['/signup'], {replaceUrl: true});
    }

}
