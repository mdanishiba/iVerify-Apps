import { Component, OnInit, ViewContainerRef, Inject } from '@angular/core';
import { UserService } from '@iverify/core/users/user.service';
import {
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Subscription, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastType } from '../../toast/toast.component';
import { ToastService } from '../../toast/toast.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RoleItem } from '@iverify/core/models/roles';
import { isEmpty } from 'lodash';

@Component({
    selector: 'iverify-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
    subs: Subscription;
    isEditing: boolean = false;
    userForm: UntypedFormGroup;
    showPassword: boolean = false;
    selectedRole: RoleItem[];
    rolesList: any[];

    constructor(
        private userService: UserService,
        private toast: ToastService,
        @Inject(ViewContainerRef) private viewContainerRef: ViewContainerRef,
        public dialogRef: MatDialogRef<UsersComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.subs = new Subscription();
        toast.setViewContainerRef(viewContainerRef);
    }

    ngOnInit(): void {
        if (!isEmpty(this.data.roles)) {
            this.rolesList = this.data.roles;
            if (!isEmpty(this.data.element)) {
                this.selectedRole = this.rolesList.filter(
                    (item) =>
                        item.name ===
                        (this.data && this.data.element.roles[0].name)
                )[0];
            }
        }
        this.userForm = new UntypedFormGroup({
            firstName: new UntypedFormControl('', Validators.required),
            lastName: new UntypedFormControl('', Validators.required),
            email: new UntypedFormControl('', [
                Validators.required,
                Validators.email,
            ]),
            password: new UntypedFormControl('', Validators.required),
            roles: new UntypedFormControl('', Validators.required),
            phone: new UntypedFormControl('', [
                Validators.required,
                Validators.pattern('^\\+260(96|76|95|75|97|77)\\d{7}$'),
            ]),
            address: new UntypedFormControl(''),
        });
        if (this.data.element && this.data.element.id > 0) {
            this.userForm.controls['password'].setValidators([]);
            this.userForm.patchValue(this.data.element);
            this.isEditing = true;
        } else {
            this.isEditing = false;
        }
    }

    onNoClick(): void {
        this.toast.show(
            ToastType.Success,
            this.isEditing ? 'TOAST_UPDATE_USER' : 'TOAST_CREATE_USER'
        );
        setTimeout(() => {
            this.dialogRef.close(true);
        }, 500);
    }

    onUserClick() {
        this.getFormValidationErrors(this.userForm);
        let reqBody = this.userForm.value;
        let { roles } = this.userForm.value;

        if (!this.isEditing) {
            reqBody.roles = [roles];
            this.subs.add(
                this.userService
                    .register(reqBody)
                    .pipe(
                        catchError((err) => {
                            this.dialogRef.close();
                            return throwError(err);
                        })
                    )
                    .subscribe((response) => {
                        this.onNoClick();
                    })
            );
        } else {
            reqBody.roles = [roles];
            delete reqBody.password;
            this.subs.add(
                this.userService
                    .updateUser(reqBody, this.data.element.id)
                    .pipe(
                        catchError((err) => {
                            return throwError(err);
                        })
                    )
                    .subscribe(async (response) => {
                        this.onNoClick();
                    })
            );
        }
    }

    getFormValidationErrors(form: UntypedFormGroup) {
        const result: any = [];
        Object.keys(form.controls).forEach((key) => {
            const controlErrors: any = form.get(key).errors;
            if (controlErrors) {
                Object.keys(controlErrors).forEach((keyError) => {
                    result.push({
                        control: key,
                        error: keyError,
                        value: controlErrors[keyError],
                    });
                });
            }
        });
        return result;
    }
}
