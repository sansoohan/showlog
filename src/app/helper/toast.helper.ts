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

  showError(title: string, text: string): void {
    Swal.fire({ title, text, icon: 'error' });
  }

  showInfo(title: string, text: string): void {
    Swal.fire({ title, text, icon: 'info' });
  }

  showWarning(title: string, text: string): void {
    Swal.fire({ title, text, icon: 'warning' });
  }

  showSuccess(title: string, text: string): void {
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

  async showPrompt(
    title: string,
    inputPlaceholder: string,
    inputValue?: string
  ): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title,
      input: 'text',
      inputValue,
      inputPlaceholder,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!';
        }
        return '';
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
        accept: 'image/*',
        'aria-label': 'Upload your profile picture'
      }
    });
  }

  async editImage(
    title: string,
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
      preConfirm: () => new Promise((resolve) => {
          resolve({
            width: (document.getElementById('swal-input1') as HTMLInputElement).value,
            height: (document.getElementById('swal-input2') as HTMLInputElement).value,
          });
        }),
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Delete',
      reverseButtons: true,
    });
  }

  async selectOneFromArray(array: Array<string>, selectedIndex: number): Promise<any> {
    const inputOptions: any = {'-1': 'None'};
    array.forEach((value: string, key: number) => inputOptions[key] = value);

    return Swal.fire({
      title: 'Edit Slack Chat for Posting',
      input: 'select',
      inputOptions,
      inputPlaceholder: array[selectedIndex] ? array[selectedIndex] : 'None',
      preConfirm: (value) => {
        return new Promise(resolve => {
          const isSelected = value !== '';
          if (isSelected) {
            resolve(Number(value));
          } else {
            resolve(array[selectedIndex] ? selectedIndex : -1);
          }
        });
      },
      showCancelButton: true,
      showCloseButton: true,
      showConfirmButton: true,
      cancelButtonText: 'Add',
    });
  }

  async editOneFromArray(array: Array<string>, selectedIndex: number): Promise<any> {
    const inputOptions: any = {'-1': 'None'};
    array.forEach((value: string, key: number) => inputOptions[key] = value);

    return Swal.fire({
      title: 'Edit Slack Chat for Posting',
      input: 'select',
      inputOptions,
      inputPlaceholder: array[selectedIndex] ? array[selectedIndex] : 'None',
      preConfirm: (value) => {
        return new Promise(resolve => {
          const isSelected = value !== '';
          if (isSelected) {
            resolve(Number(value));
          } else {
            resolve(array[selectedIndex] ? selectedIndex : -1);
          }
        });
      },
      showCancelButton: true,
      showCloseButton: true,
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: 'Edit',
      denyButtonText: 'Delete',
    });
  }

  async addSlackSync(): Promise<SweetAlertResult> {
    return Swal.mixin({
    }).fire({
      title: 'Add Slack Sync',
      html: `
        <div class="row">
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Name</p>
            <input
              id="swal-input1"
              type="text"
              class="form-control"
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Token</p>
            <input
              id="swal-input2"
              type="text"
              class="form-control"
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Channel</p>
            <input
              id="swal-input3"
              type="text"
              class="form-control"
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:200px;" class="ms-auto my-auto">Select This Channel</p>
            <input
              id="swal-input4"
              class="me-auto my-auto form-check-input"
              type="checkbox"
            >
          </div>
        </div>
      `,
      preConfirm: () => new Promise((resolve) => {
        resolve({
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          token: (document.getElementById('swal-input2') as HTMLInputElement).value,
          channel: (document.getElementById('swal-input3') as HTMLInputElement).value,
          selected: (document.getElementById('swal-input4') as HTMLInputElement).checked,
        });
      }),
      inputValidator: (value: any) => {
        const {
          name,
          token,
          channel,
        } = value;

        console.log(value);

        if (!name) {
          return 'You need to write slack name!';
        }
        if (!token) {
          return 'You need to write slack token!';
        }
        if (!channel) {
          return 'You need to write slack channel!';
        }

        return null;
      },
      showCancelButton: true,
      showConfirmButton: true,
    });
  }

  async editSlackSync(slack: any): Promise<SweetAlertResult> {
    return Swal.mixin({
    }).fire({
      title: 'Edit Slack Sync',
      html: `
        <div class="row">
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Name</p>
            <input
              id="swal-input1"
              type="text"
              class="form-control"
              value=${slack?.name}
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Token</p>
            <input
              id="swal-input2"
              type="text"
              class="form-control"
              value=${slack?.token}
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:100px;" class="my-auto">Channel</p>
            <input
              id="swal-input3"
              type="text"
              class="form-control"
              value=${slack?.channel}
            />
          </div>
          <div class="d-flex col-12 mt-2">
            <p style="width:200px;" class="ms-auto my-auto">Select This Channel</p>
            <input
              id="swal-input4"
              class="me-auto my-auto form-check-input"
              type="checkbox"
              ${slack?.selected ? 'checked' : ''}
            >
          </div>
        </div>
      `,
      preConfirm: () => new Promise((resolve) => {
        resolve({
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          token: (document.getElementById('swal-input2') as HTMLInputElement).value,
          channel: (document.getElementById('swal-input3') as HTMLInputElement).value,
          selected: (document.getElementById('swal-input4') as HTMLInputElement).checked,
        });
      }),
      inputValidator: (value: any) => {
        const {
          name,
          token,
          channel,
        } = value;

        console.log(value);

        if (!name) {
          return 'You need to write slack name!';
        }
        if (!token) {
          return 'You need to write slack token!';
        }
        if (!channel) {
          return 'You need to write slack channel!';
        }

        return null;
      },
      showCancelButton: true,
      showCloseButton: true,
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: 'Update',
      denyButtonText: 'Delete',
    });
  }
}
