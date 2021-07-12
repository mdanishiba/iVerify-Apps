import { Component, OnInit, ViewContainerRef, Inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '@iverify/api-interfaces';
import { environment } from '@iverify/core';
import { EAuthActions } from '@iverify/core/store/actions/auth.actions';
import { AppState } from '@iverify/core/store/states/app.state';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Spinkit } from 'ng-http-loader';
import { ToastService } from './features/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'iverify-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
 // hello$ = this.http.get<Message>('/api/hello');
  ngHttpLoaderConfig = environment.ngHttpLoaderConfig;
  spinkit = Spinkit;
  subs: Subscription;
  
  constructor(
  private http: HttpClient,
  private store: Store<AppState>,
  private actions$: Actions,
  private router: Router,
  @Inject(ViewContainerRef) private viewContainerRef: ViewContainerRef,
  toast: ToastService
  ) {
    this.subs = new Subscription;
    toast.setViewContainerRef(viewContainerRef);
  }

  ngOnInit() {
    this.actions$
      .pipe(ofType(EAuthActions.LoginSuccess))
      .subscribe(() => this.router.navigate(['/']));

    this.actions$
      .pipe(ofType(EAuthActions.LogoutSuccess))
      .subscribe(() =>  this.router.navigate(['/login']));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
