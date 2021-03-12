import { Injectable } from '@angular/core';
import { FormBuilder, FormArray, AbstractControl, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHelper {
  constructor(
    private fb: FormBuilder,
  ) { }

  buildFormRecursively(profileContent: any): AbstractControl {
    if (profileContent instanceof Date) {
      return this.fb.control(new Date(profileContent).toISOString().slice(0, -1));
    }
    else if (profileContent instanceof Array){
      const retArray: FormArray = this.fb.array([]);
      for (const el of profileContent){
        retArray.push(this.buildFormRecursively(el));
      }
      return retArray;
    }
    else if (profileContent instanceof Object) {
      const retHash: FormGroup = this.fb.group({});
      for (const key in profileContent){
        if (key){
          retHash.addControl(key, this.buildFormRecursively(profileContent[key]));
        }
      }
      return retHash;
    }
    else {
      return this.fb.control(profileContent);
    }
  }

  getChildContentsRecusively(
    allContent: Array<FormGroup>,
    parentContent: FormGroup
  ): Array<FormGroup>{
    const childContents = allContent
    .filter((categoryForm) => categoryForm?.value.parentId === parentContent?.value.id);
    if (childContents.length === 0){
      return [];
    }

    let returnContents = [...childContents];
    for (const childContent of childContents){
      returnContents = [
        ...returnContents,
        ...this.getChildContentsRecusively(allContent, childContent)
      ];
    }
    return returnContents;
  }

  toggleCollapse(allContents: Array<FormGroup>, toggleTarget: FormGroup): void {
    const collapsed = !toggleTarget.controls.collapsed.value;
    toggleTarget.controls.collapsed.setValue(collapsed);
    let childContents = [];
    if (!collapsed){
      childContents = allContents
      .filter((categoryForm) => categoryForm.value.parentId === toggleTarget.value.id);
    } else {
      childContents = this.getChildContentsRecusively(allContents, toggleTarget);
    }
    childContents.forEach((childCategory) => {
      childCategory.controls.hidden.setValue(collapsed);
      childCategory.controls.collapsed.setValue(!collapsed);
    });
  }

  countChildContent(allContents: Array<FormGroup>, parentContent: FormGroup): number {
    const count = allContents.filter((content) =>
      parentContent.controls.id?.value === content.value.parentId &&
      parentContent.controls.id?.value !== content.value.id
    ).length;
    return count;
  }
}
