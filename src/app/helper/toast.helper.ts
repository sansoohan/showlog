import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})

export class ToastHelper {
  constructor() { }

  showError(title: string, text: string) {
    Swal.fire({ title, text, icon: 'error' });
  }

  showInfo(title: string, text: string) {
    Swal.fire({ title, text, icon: 'info' });
  }

  showWarning(title: string, text: string){
    Swal.fire({ title, text, icon: 'warning' });
  }

  showSuccess(title: string, text: string) {
    Swal.fire({
      position: 'top-end',
      title,
      text,
      icon: 'success',
      showConfirmButton: false,
      timer: 1000,
      backdrop: `
        rgba(0,0,0,0)
      `
    });
  }

  async showPrompt(title: string, inputPlaceholder: string){
    return await Swal.fire({
      title,
      input: 'text',
      inputPlaceholder,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!';
        }
      }
    });
  }

  async askYesNo(title: string, text: string): Promise<SweetAlertResult> {
    return Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger mr-2'
      },
      buttonsStyling: false
    }).fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      reverseButtons: true
    });
  }

  async uploadImage(title: string, showCancelButton: boolean) {
    return await Swal.fire({
      title,
      input: 'file',
      showConfirmButton: true,
      showCancelButton,
      showCloseButton: true,
      confirmButtonText: 'Update Image',
      cancelButtonText: 'Remove Image',
      cancelButtonColor: '#d33',
      inputAttributes: {
        // tslint:disable-next-line:object-literal-key-quotes
        'accept': 'image/*',
        'aria-label': 'Upload your profile picture'
      }
    });
  }
}
