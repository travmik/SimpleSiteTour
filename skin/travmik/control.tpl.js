main.Control.open(
'<div id="tourControl">' +
  '<table cellpadding="0" cellspacing="0">' +
    '<tr id="tourControlNavi">' +
      '<td id="tourPlayerCell">' +
        '<a id="tourPrev" class="{prevClass}" href="javascript:;" onclick="this.blur();main.Control.prev();return false;"><span>{textPrev}</span></a>' +
        '<span id="tourCount"><span id="tourCurrentStep">{currentStep}</span> {textOf} <span id="tourStepCount">{stepCount}</span></span>' +
        '<a id="tourNext" class="{nextClass}" href="javascript:;" onclick="this.blur();main.Control.next();return false;"><span>{textNext}</span></a>' +
      '</td>' +
      '<td id="tourControlTitleCell">' +
      '<span id="tourControlTitle">{title}</span>' +
      '</td>' +
      '<td id="tourCloseCell">' +
        '<a id="tourClose" href="javascript:;" onclick="main.close();return false"><span>{textClose}</span></a>' +
      '</td>' +
    '</tr>' +
    '<tr id="tourControlBody"><td colspan="2">{body}</td></tr>' +
  '</table>' +
'</div>'
);