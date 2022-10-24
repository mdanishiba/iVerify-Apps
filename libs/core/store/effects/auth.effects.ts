import { Injectable } from '@angular/core';
import { AuthHelpers, AuthService } from '@iverify/core/auth';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  ClearUserPermissions,
  EAuthActions,
  GetCurrentUser,
  GetCurrentUserFailure,
  GetCurrentUserSuccess,
  GetPermissionsSuccess,
  GetRolesSuccess,
  Login,
  LoginFailure,
  LoginSuccess,
  Logout,
  LogoutSuccess,
  SetUserPermissions
} from '../actions/auth.actions';
import { AppState } from '../states/app.state';

@Injectable()
export class AuthEffects {
  constructor(
    private authService: AuthService,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  
  login: Observable<any> = createEffect(() => this.actions$.pipe(
    ofType<Login>(EAuthActions.Login),
    map(action => action.payload),
    switchMap(payload => {
      return this.authService.sendRequest(payload).pipe(
        switchMap(loginResponse =>
          loginResponse
            ? [new LoginSuccess(loginResponse.userData)]
            : [new LoginFailure()]
        ),
        catchError(error => [new LoginFailure()])
      );
    }),
    catchError(error => [new LoginFailure()])
  ));

  
  logout: Observable<any> = createEffect(() => this.actions$.pipe(
    ofType<Logout>(EAuthActions.Logout),
    switchMap(() => {
      this.authService.clearToken();
      return [
        new LogoutSuccess(),
        new ClearUserPermissions(),
      ];
    })
  ));

  
  getCurrentUser: Observable<any> = createEffect(() => this.actions$.pipe(
    ofType<GetCurrentUser>(EAuthActions.GetCurrentUser),
    switchMap(() => {
      return this.authService.me().pipe(
        switchMap(user => [
          user ? new GetCurrentUserSuccess(user.data) : new GetCurrentUserFailure()
        ]),
        catchError(error => [new GetCurrentUserFailure()])
      );
    }),
    catchError(error => [new GetCurrentUserFailure()])
  ));

  
  getUserPermissions: Observable<any> = createEffect(() => combineLatest(
    this.actions$.pipe(
      ofType<GetCurrentUserSuccess>(EAuthActions.GetCurrentUserSuccess)
    ),
    this.actions$.pipe(
      ofType<GetPermissionsSuccess>(EAuthActions.GetPermissionsSuccess)
    ),
    this.actions$.pipe(ofType<GetRolesSuccess>(EAuthActions.GetRolesSuccess))
  ).pipe(
    switchMap(
      ([
        getCurrentUserSuccess,
        getPermission,
        getRolesSuccess
      ]) => [
        new SetUserPermissions(
          AuthHelpers.User.GetUserPermissions(
            getCurrentUserSuccess.payload,
            getPermission.payload,
            getRolesSuccess.payload
          )
        )
      ]
    )
  ));
}
