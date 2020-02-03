import { LoadingController, AlertController } from '@ionic/angular';
import { Component, OnInit }    from '@angular/core';
import { finalize, timeout } 	from 'rxjs/operators';
import { Storage }              from '@ionic/storage';
import { Router }               from '@angular/router';

import { ApiService }           from '../services/api.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.page.html',
    styleUrls: ['./signup.page.scss']
})
export class SignupPage implements OnInit {
    postData = {
                    url: 'signup',
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    password_confirmation: ''
                };

    constructor(
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private apiService: ApiService,
        private storage: Storage,
        private router: Router
    ) {}

    ngOnInit() {
		// Something TODO here
	}

    validateInputs() {
        let name     = this.postData.name.trim();
        let username = this.postData.username.trim();
        let password = this.postData.password.trim();
        let repassword = this.postData.password_confirmation.trim();
        let email = this.postData.email.trim();
        return (
            this.postData.username && username.length > 0 &&
            this.postData.password && password.length > 0 &&
            this.postData.password_confirmation && repassword.length > 0 &&
            this.postData.email && email.length > 0 &&
            this.postData.name && name.length > 0
            
        );
    }

    async registerUser() {
		if (this.validateInputs()) {
            if(this.postData.password != this.postData.password_confirmation) {
                this.alertError('Validation Error', 'Your passwords must match.');
            }
			let loader = await this.loadingCtrl.create({
							message: 'Por favor espera...',
						});
			await loader.present();

			this.apiService.registerUser(this.postData)
			.pipe(
				timeout(8000),
				finalize(() => { loader.dismiss(); })
			)
			.subscribe(
				(response: any) => {
					if(response.success){
						this.storage.set('userData', response.credentials);
                        this.router.navigate(['/login'], {replaceUrl: true});
                        this.alertError('Estás listo', 'Inicia sesión con tu nueva cuenta');
					} else {
						this.alertError('El Registro fallo', response.message);
					}
				},
				(fail) => {
					console.log(fail);
					loader.dismiss();
					this.alertError('El Registro fallo', 'Por favor verifique si su conexión Wifi.');
				}
			);
		} else {
			this.alertError('Error', 'Proporcione un nombre de usuario, correo electrónico y contraseña para continuar.');
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
    
    loginPage(){
        this.router.navigate(['/login'], {replaceUrl: true});
    }
}
