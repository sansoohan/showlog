import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { ImageHelper, ImageContent } from './image.helper';

@Injectable({
  providedIn: 'root'
})

export class ToastHelper {
  constructor(
    private imageHelper: ImageHelper,
  ) { }

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

  async showPrompt(title: string, inputPlaceholder: string, inputValue?: string){
    return await Swal.fire({
      title,
      input: 'text',
      inputValue,
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
        cancelButton: 'btn btn-danger me-2'
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

  async askUpdateDelete(title: string, inputPlaceholder: string, inputValue?: string): Promise<SweetAlertResult> {
    return Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger me-2',
        closeButton: 'btn btn-secondary me-2',
      },
      buttonsStyling: false
    }).fire({
      title,
      input: 'text',
      inputPlaceholder,
      inputValue,
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Remove',
      reverseButtons: true
    });
  }

  async uploadImage(title: string, showCancelButton: boolean): Promise<SweetAlertResult> {
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

  async editImage(
    title,
    imageContent: ImageContent
  ): Promise<SweetAlertResult> {
    const imageStyle = this.imageHelper.getImageStyle(imageContent);

    return Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger me-2',
        closeButton: 'btn btn-secondary me-2',
      },
      buttonsStyling: false
    }).fire({
      title,
      html: `
        <div class="d-flex">
          ${this.imageHelper.getImageString(imageContent)}
          <div class="my-auto">
            <div class="d-flex mb-2">
              <p style="width:70px;" class="my-auto">Width</p>
              <input
                id="swal-input1"
                type="text"
                class="form-control"
                style="width:70px;"
                value="${imageStyle?.width || '100%'}"
              />
            </div>
            <div class="d-flex">
              <p style="width:70px;" class="my-auto">Height</p>
              <input
                id="swal-input2"
                type="text"
                class="form-control"
                style="width:70px;"
                value="${imageStyle?.height || ''}"
              />
            </div>
          </div>
        </div>
      `,
      preConfirm: () => {
        return new Promise((resolve) => {
          resolve({
            width: (document.getElementById('swal-input1') as HTMLInputElement).value,
            height: (document.getElementById('swal-input2') as HTMLInputElement).value,
          });
        });
      },
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Delete',
      reverseButtons: true,
    });
  }
}
