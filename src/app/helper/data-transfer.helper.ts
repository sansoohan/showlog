import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';

const Timestamp = firebase.default.firestore.Timestamp;

@Injectable({
  providedIn: 'root'
})
export class DataTransferHelper {
  constructor(
  ) { }

  numberToArray(input: number): Array<any> {
    input = input < 0 ? 0 : input;
    return new Array(input);
  }

  range = (start: number, stop: number, step: number) =>
    Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step))

  markDownPreprocess(input: string): string {
    const lines = input.split('\n');
    const codeLineStartEndIndexes: Array<any> = lines.map((line, i) =>
      line.split('```').length % 2 === 0
        ? i
        : null
      ).filter((num) => num !== null);

    if (codeLineStartEndIndexes.length % 2 === 1) {
      codeLineStartEndIndexes.pop();
    }
    let codeLineNumbers: Array<number> = [];
    for (let i = 0; i < codeLineStartEndIndexes.length; i += 2) {
      codeLineNumbers = [
        ...codeLineNumbers,
        ...this.range(codeLineStartEndIndexes[i],
          codeLineStartEndIndexes[i + 1],
        1)
      ];
    }

    const retLineString = lines.map((line, i) => {
      line = this.preProcessEmoji(line);
      if (!line) {
        return line + '&NewLine;<br>\n';
      }
      if (codeLineNumbers.includes(i)) {
        return `\n${line}${codeLineNumbers.includes(i + 1) ? '' : '\n'}`;
      }
      else if (/\|(.+)\|/g.test(line)) {
        return line + '\n';
      }

      return line + '<br>\n';
    });
    return retLineString.join('');
  }

  preProcessEmoji(inputString: string): string {
    const preProcessEmojiList: {[key: string]: any} = {
      ':smiling_face_with_three_hearts:': ':smiling_face_with_3_hearts:',
      ':hand_over_mouth:': ':face_with_hand_over_mouth:',
      ':hugs:': ':hugging:',
      ':raised_eyebrow:': ':face_with_raised_eyebrow:',
      ':roll_eyes:': ':rolling_eyes:',
      ':vomiting_face:': ':face_vomiting:',
      ':cowboy_hat_face:': ':face_with_cowboy_hat:',
      ':monocle_face:': ':face_with_monocle:',
      ':frowning_face:': ':slightly_frowning_face:',
      ':pout:': ':rage:',
      ':cursing_face:': ':face_with_symbols_over_mouth:',
      ':heavy_heart_exclamation:': ':heavy_heart_exclamation_mark_ornament:',
      ':eye_speech_bubble:': ':eye_in_speech_bubble:',
      ':hand:': ':raised_hand:',
      ':vulcan_salute:': ':vulcan:',
      ':crossed_fingers:': ':hand_with_index_and_middle_finger_crossed:',
      ':fu:': ':middle_finger:',
      ':fist_raised:': ':fist:',
      ':facepunch:': ':punch:',
      ':fist_oncoming:': ':punch:',
      ':fist_left:': ':left_fist:',
      ':fist_right:': ':right_fist:',
      ':woman_blond_haired:': ':blond-haired_woman:',
      ':woman_blonde:': ':blond-haired_woman:',
      ':man_blond_haired:': ':blond-haired_man:',
      ':pouting_face:': ':person_pouting:',
      ':man_no_good:': ':man_gesturing_no:',
      ':man_ng:': ':man_gesturing_no:',
      ':woman_ng:': ':woman_gesturing_no:',
      ':woman_no_good:': ':woman_gesturing_no:',
      ':person_ok:': ':person_gesturing_ok:',
      ':man_ok:': ':man_gesturing_ok:',
      ':woman_ok:': ':woman_gesturing_ok:',
      ':person_tipping_hand:': ':information_desk_person:',
      ':man_sassy:': ':man_tipping_hand:',
      ':woman_sassy:': ':woman_tipping_hand:',
      ':policeman:': ':police_officer:',
      ':policewoman:': ':woman_police_officer:',
      ':male_detective:': ':man_detective:',
      ':female_detective:': ':woman_detective:',
      ':guardswoman:': ':woman_guard:',
      ':person_with_turban:': ':person_wearing_turban:',
      ':bride_with_veil:': ':person_with_veil:',
      ':woman_older:': ':older_woman:',
      ':man_older:': ':older_man:',
      ':person_deaf:': ':deaf_person:',
      ':man_deaf:': ':deaf_man:',
      ':woman_deaf:': ':deaf_woman:',
      ':person_information_desk:': ':information_desk_person:',
      ':woman_with_turban:': ':woman_wearing_turban:',
      ':woman_pregnant:': ':pregnant_woman:',
      ':person_blond_haired:': ':blond_haired_person:',
      ':person_bearded:': ':bearded_person:',
      ':man_massage:': ':man_getting_face_massage:',
      ':woman_massage:': ':woman_getting_face_massage:',
      ':man_haircut:': ':man_getting_haircut:',
      ':woman_haircut:': ':woman_getting_haircut:',
      ':business_suit_levitating:': ':man_in_business_suit_levitating:',
      ':person_sauna:': ':person_in_steamy_room:',
      ':man_sauna:': ':man_in_steamy_room:',
      ':woman_sauna:': ':woman_in_steamy_room:',
      ':climbing:': ':person_climbing:',
      ':person_rowing:': ':person_rowing_boat:',
      ':man_rowing:': ':man_rowing_boat:',
      ':woman_rowing:': ':woman_rowing_boat:',
      ':golfing:': ':person_golfing:',
      ':man_basketball:': ':man_bouncing_ball:',
      ':woman_basketball:': ':woman_bouncing_ball:',
      ':weight_lifting:': ':person_lifting_weights:',
      ':man_weight_lifting:': ':man_lifting_weights:',
      ':woman_weight_lifting:': ':woman_lifting_weights:',
      ':cartwheeling:': ':person_doing_cartwheel:',
      ':person_handball:': ':person_playing_handball:',
      ':lotus_position:': ':person_in_lotus_position:',
      ':man_lotus_position:': ':man_in_lotus_position:',
      ':woman_lotus_position:': ':woman_in_lotus_position:',
      ':sleeping_bed:': ':sleeping_accommodation:',
      ':woman_couplekiss_man:': ':couplekiss:',
      ':man_couplekiss_man:': ':couplekiss_mm:',
      ':woman_couplekiss_woman:': ':couplekiss_ww:',
      ':woman_man_couple_with_heart:': ':couple_with_heart_woman_man:',
      ':man_couple_with_heart_man:': ':couple_with_heart_mm:',
      ':woman_couple_with_heart_woman:': ':couple_with_heart_ww:',
      ':family_man_woman_girl:': ':family_mwg:',
      ':family_man_woman_boy_boy:': ':family_mwbb:',
      ':family_man_woman_boy_girl:': ':family_mwbg:',
      ':family_man_woman_girl_boy:': ':family_mwgb:',
      ':family_man_woman_girl_girl:': ':family_mwgg:',
      ':family_man_man_girl:': ':family_mmg:',
      ':family_man_man_boy:': ':family_mmb:',
      ':family_man_man_boy_boy:': ':family_mmbb:',
      ':family_man_man_boy_girl:': ':family_mmbg:',
      ':family_man_man_girl_boy:': ':family_mmgb:',
      ':family_man_man_girl_girl:': ':family_mmgg:',
      ':family_woman_woman_girl:': ':family_wwg:',
      ':family_woman_woman_boy:': ':family_wwb:',
      ':family_woman_woman_boy_boy:': ':family_wwbb:',
      ':family_woman_woman_boy_girl:': ':family_wwbg:',
      ':family_woman_woman_girl_boy:': ':family_wwgb:',
      ':family_woman_woman_girl_girl:': ':family_wwgg:',
      ':kiwi_fruit:': ':kiwifruit:',
      ':clinking_glasses:': ':clinking_glass:',
      ':kick_scooter:': ':scooter:',
      ':car:': ':red_car:',
      ':t-rex:': ':t_rex:',
      ':milk_glass:': ':glass_of_milk:',
      ':plate_with_cutlery:': ':fork_and_knife_with_plate:',
      ':hocho:': ':knife:',
      ':houses:': ':house_buildings:',
      ':derelict_house:': ':derelict_house_building:',
      ':boat:': ':sailboat:',
      ':motor_boat:': ':motorboat:',
      ':flight_departure:': ':airplane_departure:',
      ':flight_arrival:': ':airplane_arriving:',
      ':artificial_satellite:': ':satellite_orbital:',
      ':mantelpiece_clock:': ':mantlepiece_clock:',
      ':moon:': ':waxing_gibbous_moon:',
      ':phone:': ':telephone:',
      ':iphone:': ':mobile_phone:',
      ':film_strip:': ':film_frames:',
      ':lotion_bottle:': ':squeeze_bottle:',
      ':sun_behind_small_cloud:': ':white_sun_small_cloud:',
      ':sun_behind_large_cloud:': ':white_sun_cloud:',
      ':computer_mouse:': ':mouse_three_button:',
      ':camera_flash:': ':camera_with_flash:',
      ':newspaper_roll:': ':rolled_up_newspaper:',
      ':fountain_pen:': ':lower_left_fountain_pen:',
      ':pen:': ':lower_left_ballpoint_pen:',
      ':shopping:': ':shopping_bags:',
      ':swim_brief:': ':briefs:',
      ':balance_scale:': ':scales:',
      ':next_track_button:': ':next_track:',
      ':play_or_pause_button:': ':play_pause:',
      ':previous_track_button:': ':previous_track:',
      ':tornado:': ':cloud_tornado:',
    };

    if (/:(\w+):/g.test(inputString)) {
      let searchList = [...inputString.matchAll(/:(\w+)_man:/g)];
      for (const search of searchList){
        inputString = inputString.replace(new RegExp(search[0], 'g'), `:man_${search[1]}:`);
      }
      searchList = [...inputString.matchAll(/:(\w+)_woman:/g)];
      for (const search of searchList){
        inputString = inputString.replace(new RegExp(search[0], 'g'), `:woman_${search[1]}:`);
      }
      searchList = [...inputString.matchAll(/:(\w+)_person:/g)];
      for (const search of searchList){
        inputString = inputString.replace(new RegExp(search[0], 'g'), `:person_${search[1]}:`);
      }
      searchList = [...inputString.matchAll(/:(\w+):/g)];
      for (const search of searchList) {
        const searchedEmoji = preProcessEmojiList[search[0]];
        if (searchedEmoji) {
          inputString = inputString.replace(
            new RegExp(search[0], 'g'), `${preProcessEmojiList[search[0]]}`
          );
        }
      }
    }
    return inputString;
  }
  numberToDateString(input: number): string {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const now = Number(new Date());
    if (now - input < 2 * SECOND) { return `${Math.floor((now - input) / SECOND)} second ago`; }
    if (now - input < MINUTE) { return `${Math.floor((now - input) / SECOND)} seconds ago`; }
    if (now - input < 2 * MINUTE) { return `${Math.floor((now - input) / MINUTE)} minute ago`; }
    if (now - input < HOUR) { return `${Math.floor((now - input) / MINUTE)} minutes ago`; }
    if (now - input < 2 * HOUR) { return `${Math.floor((now - input) / HOUR)} hour ago`; }
    if (now - input < DAY) { return `${Math.floor((now - input) / HOUR)} hours ago`; }
    const date = new Date(input);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
  }

  replaceToDateRecursively(content: any): any{
    if (content instanceof Array){
      for (let i = 0; i < content.length; i++){
        if (content[i] instanceof Timestamp){
          content[i] = content[i].toDate();
        }
        else{
          this.replaceToDateRecursively(content[i]);
        }
      }
    }
    else if (content instanceof Object) {
      for (const key in content){
        if (key){
          if (content[key] instanceof Timestamp){
            content[key] = content[key].toDate();
          }
          else{
            this.replaceToDateRecursively(content[key]);
          }
        }
      }
    }
    return content;
  }
}
