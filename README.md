# IntelliOverlayer (v0.2.0)

오버레이어 커스텀태그 작성에 도움을 주는 익스텐션입니다!

학업 등의 이슈로 업데이트가 많이 늦어질 수 있습니다.<br><br>

This is VSCode Extension that helps writing Overlayer customtags!

Update can be delayed because of my classwork / etc.<br><br>

___

## 기능 Features

* 오버레이어 관련 함수 추천 및 자동완성 ||| Suggest and Auto-complete Overlayer-related function

* 오버레이어 관련 단어에 마우스 올리면 등록된 문서 보여줌 ||| Show documentation about Overlayer-related things when mouse over<br><br>

___

## 익스텐션 설정 Extension Settings

* `intellioverlayer.workspaceFolder`
    - 커스텀 태그 워크스페이스로 인식할 폴더명입니다.
    - Folder names to recognize as custom tag workspace.<br><br>
* `intellioverlayer.modsFolder`
    - 얼불춤 모드가 설치된 경로입니다.
    - Path to adofai mods.<br><br>

___

## Release Notes

### 0.2.0

* <b>`workspaceFolder`의 기본값을 [`Overlayer`, `Scripts`]로 바꿨습니다. 이 변경사항은 업데이트로 적용되지 않으니 수동으로 업데이트해주시기 바랍니다.</b>
* <b>Changed default value of `workspaceFolder` to [`Overlayer`, `Scripts`]. This change is not applied by updating, so please update it for yourself.</b>
<br><br>
* 자동완성 정보를 오버레이어의 `Scripts` 폴더에서 직접 로드합니다. ||| Now load AutoComplete info from `Scripts` folder in Overlayer directly.
    * 이에 따라 v0.1.2까지 지원하던 호버독스에서의 추가 설명이 제거되었습니다. ||| Due to this, Additional descriptions in hover docs (which v0.1.2 and lower supports) are deleted.
* 오버레이어의 공식 로고가 생겨 아이콘을 해당 로고로 변경하였습니다. ||| Changed Icon to Overlayer official logo.
* 자동완성 우선순위를 제거하였습니다. ||| Removed sort priority for Overlayer stuffs.

### 0.1.2

* 태그의 설명을 [오버레이어 위키](http://overlayer.info/)의 설명으로 교체했습니다. ||| Replaced tag's descriptions to [Overlayer Wiki](http://overlayer.info/)'s descriptions
    * 영문 번역은 추후 추가할 예정입니다. ||| English translation will be available soon
* `Tags.json` 파일을 위키의 분류에 따라 7+2(`Enum`, `Class`)개의 파일로 분할했습니다. ||| Separated `Tags.json` file to 7+2(`Enum`, `Class`) files according to the classification of wiki

### 0.1.1
* Added extension icon (temporary)
    * 임시 아이콘이기 때문에 언제든지 바뀔 수 있습니다. ||| It can be changed at anytime since this is temporary icon

### 0.1.0

* `Overlayer.registerTag` 함수에 `notplaying` 매개변수를 추가했습니다. ||| Added `notplaying` parameter to `Overlayer.registerTag`

### 0.0.2

* 이제 태그를 익스텐션 내부의 별도 json에서 로드합니다.  ||| Now load tags in external json (it's inside the extension folder)

### 0.0.1

* 초기 릴리즈 ||| Initial release of IntelliOverlayer
