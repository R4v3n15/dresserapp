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
		if (this.password  && this.username  && this.username.length > 4 && this.password.length > 4) {
			let loader = await this.loadingCtrl.create({
							message: 'Plase wait...',
						});
			await loader.present();

			this.apiService.authenticateUser({'url': 'login/login', 'username': this.username, 'password': this.password })
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
						this.alertError('Code Required', response.message);
					}
				},
				(fail) => {
					console.log(fail);
					loader.dismiss();
					this.alertError('Timeout Error', 'Please check your Wifi connection.');
				}
			);
		} else {
			this.alertError('Error', 'Please provide a username and password to continue.');
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

}
