define([
    'app/controller/base',
    'app/module/validate',
    'app/interface/GeneralCtr',
    'app/interface/UserCtr',
    'app/interface/TradeCtr',
    'app/interface/AccountCtr'
], function(base, Validate, GeneralCtr, UserCtr, TradeCtr, AccountCtr) {
    var code = base.getUrlParam("code") || '';
    var coin = base.getUrlParam("coin") || 'BTC'; // 币种
    var status = '1';
    var mid = 0;

    init();

    function init() {
        $(".head-nav-wrap .sell").addClass("active");
        base.showLoadingSpin();
        if (code != "") {
            $("#draftBtn").addClass("hidden")
        }
        //币种下拉
        getCoinList();
        $("#coin").text(coin.toUpperCase())
        $("#tradeCoin").val(coin.toUpperCase())

        if (coin && base.getCoinType($("#tradeCoin").val()) == "1") {
            mid = ''
            $("#price").attr("disabled", false)
            $(".premiumRateExp-wrap").addClass("hidden");
        }

        $.when(
            GeneralCtr.getSysConfig("trade_remind"),
            GeneralCtr.getDictList({ "parentKey": "trade_time_out" }),
            getAdvertisePrice(),
            getExplain('sell'),
            getAccount(coin.toUpperCase())
        ).then((data1, data2, data3) => {
            //说明
            $("#tradeWarn").html(data1.cvalue.replace(/\n/g, '<br>'));

            //付款时限
            var html = ''
            data2.reverse().forEach((item) => {
                html += `<option value="${item.dvalue}">${item.dvalue}</option>`
            });
            $("#payLimit").html(html);
            //价格
            $("#price").attr("data-coin", coin.toUpperCase())
            $("#price").val(data3.mid);
            mid = data3.mid;

            if (code != "") {
                getAdvertiseDetail();
            } else {
                base.hideLoadingSpin()
            }
        }, base.hideLoadingSpin)

        // 高级设置-开放时间
        var htmlStart = '<option value="24">关闭</option>';
        var htmlEnd = '<option value="24">关闭</option>';

        for (var i = 0; i <= 23; i++) {
            if (i < 10) {
                htmlStart += `<option value="${i}">0${i}:00</option>`
            } else {
                htmlStart += `<option value="${i}">${i}:00</option>`
            }
        }

        for (var i = 1; i <= 23; i++) {
            if (i < 10) {
                htmlEnd += `<option value="${i}">0${i}:00</option>`
            } else {
                htmlEnd += `<option value="${i}">${i}:00</option>`
            }
        }
        htmlEnd += `<option value="24">23:59</option>`
        $(".selectWrap select.startTime").html(htmlStart)
        $(".selectWrap select.endTime").html(htmlEnd);

        addListener();
    }

    function getAdvertisePrice() {
        if (base.getCoinType(coin.toUpperCase()) == '0') {
            return TradeCtr.getAdvertisePrice(coin.toUpperCase());
        } else {
            return '-';
        }

    }

    //根据config配置设置 币种列表
    function getCoinList() {
        var coinList = base.getCoinList();
        var coinListKey = Object.keys(coinList);
        var listHtml = '';

        for (var i = 0; i < coinListKey.length; i++) {
            var tmpl = coinList[coinListKey[i]]
            listHtml += `<option value="${tmpl.coin}">${tmpl.name}(${tmpl.coin})</option>`;
        }
        $("#tradeCoin").html(listHtml);
    }

    //我的账户
    function getAccount(currency) {
        return AccountCtr.getAccount().then((data) => {
            data.accountList.forEach(function(item) {
                if (item.currency == currency) {
                    $(".accountLeftCountString").attr('data-amount', base.formatMoneySubtract(item.amountString, item.frozenAmountString, currency));
                }
            })
            $(".accountLeftCountString").text($(".accountLeftCountString").attr('data-amount'))
        }, base.hideLoadingSpin)
    }

    //获取广告详情
    function getAdvertiseDetail() {
        return TradeCtr.getAdvertiseDetail(code).then((data) => {
            status = data.status;
            data.premiumRate = data.premiumRate * 100;
            data.minTrade = data.minTrade.toFixed(2);
            data.maxTrade = data.maxTrade.toFixed(2);
            mid = data.marketPrice;
            var tradeCoin = data.tradeCoin ? data.tradeCoin : 'ETH';
            data.totalCount = base.formatMoney(data.totalCountString, '', tradeCoin)

            //广告类型
            if (data.tradeType == '1') {
                $(".trade-type .item").eq(0).addClass("on").siblings('.item').removeClass("on").addClass("hidden")
            } else {
                $(".trade-type .item").eq(1).addClass("on").siblings('.item').removeClass("on").addClass("hidden")
            }
            $(".trade-type .item.on .icon-check").click();

            $("#form-wrapper").setForm(data);

            //币种
            $("#tradeCoin").val(data.tradeCoin).attr("disabled", true);

            //账户余额
            $("#coin").text($("#tradeCoin").val())
            $("#price").attr("data-coin", $("#tradeCoin").val())
            $("#price").val(Math.floor(data.truePrice * 100) / 100);
            //账户余额
            $(".accountLeftCountString").text($(".accountLeftCountString").attr('data-amount'))

            //是否仅粉丝
            if (data.onlyTrust == '1') {
                $("#onlyTrust").addClass("on")
            } else {
                $("#onlyTrust").removeClass("on")
            }

            //开放时间
            if (data.displayTime.length && data.displayTime.length > 0) { //自定义
                $(".time-type .item").eq(1).addClass("on").siblings(".item").removeClass("on");
                $("#timeWrap").removeClass("hide")

                $("#timeWrap .time-item:nth-of-type(1) .startTime").val(data.displayTime[0].startTime);
                $("#timeWrap .time-item:nth-of-type(1) .endTime").val(data.displayTime[0].endTime)
                $("#timeWrap .time-item:nth-of-type(2) .startTime").val(data.displayTime[1].startTime);
                $("#timeWrap .time-item:nth-of-type(2) .endTime").val(data.displayTime[1].endTime)
                $("#timeWrap .time-item:nth-of-type(3) .startTime").val(data.displayTime[2].startTime);
                $("#timeWrap .time-item:nth-of-type(3) .endTime").val(data.displayTime[2].endTime)
                $("#timeWrap .time-item:nth-of-type(4) .startTime").val(data.displayTime[3].startTime);
                $("#timeWrap .time-item:nth-of-type(4) .endTime").val(data.displayTime[3].endTime)
                $("#timeWrap .time-item:nth-of-type(5) .startTime").val(data.displayTime[4].startTime);
                $("#timeWrap .time-item:nth-of-type(5) .endTime").val(data.displayTime[4].endTime)
                $("#timeWrap .time-item:nth-of-type(6) .startTime").val(data.displayTime[5].startTime);
                $("#timeWrap .time-item:nth-of-type(6) .endTime").val(data.displayTime[5].endTime)
                $("#timeWrap .time-item:nth-of-type(7) .startTime").val(data.displayTime[6].startTime);
                $("#timeWrap .time-item:nth-of-type(7) .endTime").val(data.displayTime[6].endTime)

            } else { // 任何时候
                $(".time-type .item").eq(0).addClass("on").siblings(".item").removeClass("on");
                $("#timeWrap").addClass("hide")
            }

            if (data.status == "1") {
                $("#doDownBtn").removeClass("hidden")
            }
            base.hideLoadingSpin();
        }, base.hideLoadingSpin)
    }

    //获取广告说明 type = buy ,sell
    function getExplain(type) {
        var param = ''
        if (type == 'buy') {
            param = 'buy_ads_hint'
        } else if (type == 'sell') {
            param = 'sell_ads_hint'
        }

        document.getElementById("form-wrapper").reset();
        $("#price").val(mid);

        return GeneralCtr.getSysConfigType(param, true).then((data) => {
            $("#displayTimeExp").html(data.displayTime)
            $("#maxTradeExp").html(data.maxTrade)
            $("#minTradeExp").html(data.minTrade)
            $("#payLimitExp").html(data.payLimit)
            $("#payTypeExp").html(data.payType)
            $("#premiumRateExp").html(data.premiumRate)
            $("#priceExp").html(data.price)

            if (type == 'buy') {
                $("#protectPriceExp").siblings('.txt').text('最高价格：');
                $("#protectPrice").attr('placeholder', '广告最高可成交的价格');
                $("#totalCountExp").siblings('.txt').text('购买总量：');
                $("#totalCount").attr('placeholder', '请输请入购买币的总量');
            } else if (type == 'sell') {
                $("#protectPriceExp").siblings('.txt').text('最低价格：')
                $("#protectPrice").attr('placeholder', '广告最低可成交的价格');
                $("#totalCountExp").siblings('.txt').text('出售总量：');
                $("#totalCount").attr('placeholder', '请输入售卖币的总量');
            }

            $("#protectPriceExp").html(data.protectPrice)
            $("#totalCountExp").html(data.totalCount);
            $("#trustExp").html(data.trust);
            base.hideLoadingSpin();
        }, base.hideLoadingSpin)
    }

    function addListener() {

        //選擇切換-点击
        $(".trade-type .icon-check").click(function() {
            var _this = $(this);
            base.showLoadingSpin();
            //在线出售
            if (_this.parent(".item").index() == '0') {
                $(".accountCount").removeClass("hidden")
                getExplain('sell')
                    //在线购买
            } else if (_this.parent(".item").index() == '1') {
                $(".accountCount").addClass("hidden")
                getExplain('buy')
            }
            _this.parent(".item").addClass("on").siblings(".item").removeClass("on");
        })

        //受信任-点击
        $("#onlyTrust").click(function() {
            if ($(this).hasClass("on")) {
                $(this).removeClass("on");
            } else {
                $(this).addClass("on");
            }
        })

        //開放時間選擇-点击
        $(".time-type .icon-check").click(function() {
            var _this = $(this)
            _this.parent(".item").addClass("on").siblings(".item").removeClass("on")
            if (_this.parent(".item").hasClass("all")) {
                $("#timeWrap").addClass("hide")
            } else {
                $("#timeWrap").removeClass("hide")
            }
        })

        //显示高级设置 - 点击
        $(".advertise-hidden").click(function() {
            var _this = $(this)
            if (_this.hasClass("hide")) {
                $(".advertise-set .set-wrap").removeClass("hidden")
                _this.removeClass("hide")
                _this.text("隐藏高级设置...")
            } else {
                $(".advertise-set .set-wrap").addClass("hidden")
                _this.text("显示高级设置...")
                _this.addClass("hide")
            }
        })

        //切换广告类型
        $('.fb-ul').click((e) => {
            let target = e.target;
            $(target).addClass('fb-sel').siblings('li').removeClass('fb-sel');
        })


        var _formWrapper = $("#form-wrapper");
        _formWrapper.validate({
            'rules': {
                "truePrice": {
                    required: true,
                    number: true,
                    amountCny: true
                },
                "premiumRate": {
                    required: true,
                    number: true,
                    tofixed2: true,
                    range: [-99.99, 99.99]
                },
                "protectPrice": {
                    required: true,
                    number: true,
                    amountCny: true
                },
                "minTrade": {
                    required: true,
                    number: true,
                    amountCny: true
                },
                "maxTrade": {
                    required: true,
                    number: true,
                    amountCny: true
                },
                "totalCount": {
                    required: true,
                    number: true,
                    amountEth: true
                },
                "payType": {
                    required: true,
                },
                "payLimit": {
                    required: true,
                },
                "leaveMessage": {
                    required: true,
                },
            },
            onkeyup: false
        })

        //溢价
        $("#premiumRate").keyup(function() {
            if ($("#premiumRate").val() == '' || !$("#premiumRate").val()) {
                $("#price").val(mid);
            } else {
                $("#price").val((mid + mid * ($("#premiumRate").val() / 100)).toFixed(2));
            }
        })

        //发布
        $("#submitBtn").click(function() {
            if (!base.isLogin()) {
                base.goLogin();
                return;
            }
            if (_formWrapper.valid()) {
                var publishType = '0';
                //草稿发布
                if (code != "" && status != '1') {
                    publishType = '2';
                    //编辑发布，原广告下
                } else if (code && status == '1') {
                    publishType = '3';
                    //直接发布
                } else {
                    publishType = '1';
                }

                doSubmit(publishType)
            }
        })

        //保存草稿
        $("#draftBtn").click(function() {
            if (!base.isLogin()) {
                base.goLogin();
                return;
            }
            if (_formWrapper.valid()) {
                var publishType = '0';
                doSubmit(publishType)
            }
        })

        //发布/保存草稿
        function doSubmit(publishType) {
            var params = _formWrapper.serializeObject();

            if (code != "") {
                params.adsCode = code;
            }

            params.premiumRate = params.premiumRate / 100;
            //广告类型 0=买币，1=卖币
            params.tradeType = $(".trade-type .item.on").index() == '0' ? '1' : '0';
            params.onlyTrust = $("#onlyTrust").hasClass("on") ? '1' : '0';
            params.tradeCoin = $("#tradeCoin").val();
            params.tradeCurrency = "CNY";
            params.publishType = publishType;

            if (base.getCoinType(params.tradeCoin) == '1') {
                params.protectPrice = params.truePrice;
            } else {
                params.truePrice = '0';
            }

            params.totalCount = base.formatMoneyParse(params.totalCount, '', params.tradeCoin)

            if ($(".time-type .item.on").index() == "1") {
                params.displayTime = [{
                    week: '1',
                    startTime: $("#timeWrap .time-item:nth-of-type(1) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(1) .endTime").val()
                }, {
                    week: '2',
                    startTime: $("#timeWrap .time-item:nth-of-type(2) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(2) .endTime").val()
                }, {
                    week: '3',
                    startTime: $("#timeWrap .time-item:nth-of-type(3) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(3) .endTime").val()
                }, {
                    week: '4',
                    startTime: $("#timeWrap .time-item:nth-of-type(4) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(4) .endTime").val()
                }, {
                    week: '5',
                    startTime: $("#timeWrap .time-item:nth-of-type(5) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(5) .endTime").val()
                }, {
                    week: '6',
                    startTime: $("#timeWrap .time-item:nth-of-type(6) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(6) .endTime").val()
                }, {
                    week: '7',
                    startTime: $("#timeWrap .time-item:nth-of-type(7) .startTime").val(),
                    endTime: $("#timeWrap .time-item:nth-of-type(7) .endTime").val()
                }]
            }
            base.showLoadingSpin()
            return TradeCtr.submitAdvertise(params).then(() => {
                base.showMsg('操作成功！');
                base.showLoadingSpin();
                setTimeout(() => {
                    if (params.tradeType == '0') {
                        base.gohref('../trade/sell-list.html?coin=' + coin);
                    } else {
                        base.gohref('../trade/buy-list.html?coin=' + coin);
                    }
                    base.hideLoadingSpin()
                }, 1000)
            }, base.hideLoadingSpin)

        }

        //下架
        $("#doDownBtn").on("click", function() {
            if (!base.isLogin()) {
                base.goLogin();
                return;
            }
            base.confirm("确认下架此广告？").then(() => {
                base.showLoadingSpin()
                TradeCtr.downAdvertise(code).then(() => {
                    base.hideLoadingSpin();

                    base.showMsg("操作成功");
                    setTimeout(function() {
                        history.go(-1)
                    }, 1500)
                }, base.hideLoadingSpin)
            }, base.emptyFun)
        })

        //交易币种 select
        $("#tradeCoin").change(function() {
            base.showLoadingSpin();
            document.getElementById("form-wrapper").reset();

            tradeCoinChange(base.getCoinType($("#tradeCoin").val())).then((data) => {

                if (base.getCoinType($("#tradeCoin").val()) == "1") {
                    mid = ''
                    $("#price").attr("disabled", false)
                    $(".premiumRateExp-wrap").addClass("hidden");
                    $(".premiumRateExp-wrap").addClass("hidden");
                } else if (base.getCoinType($("#tradeCoin").val()) == "0") {
                    mid = data.mid;

                    $("#price").attr("disabled", true)
                    $(".premiumRateExp-wrap").removeClass("hidden")
                }
                $("#coin").text($("#tradeCoin").val())
                $("#price").attr("data-coin", $("#tradeCoin").val())
                $("#price").val(mid);
                base.hideLoadingSpin();

            }, () => {
                $("#tradeCoin").val($("#price").attr("data-coin"));
                base.hideLoadingSpin();
            })

        })

        // 进度条实现
        let i = 0,
            goX = 0,
            goLeft = '';
        $('.num-go').mousedown(function(e) {
            if (i == 0) {
                goX = e.pageX;
                goLeft = parseInt($(this).css('left'));
            }
            i++;
            let parWidth = $('.num-huadtiao').width();
            let left = (goLeft / parWidth).toFixed(1) * 100;
            $('.go-box').mousemove(e => {
                let mlen = (((e.pageX - goX) / parWidth) * 100).toFixed(2);
                if (mlen >= 50) {
                    mlen = 50;
                }
                if (mlen <= -50) {
                    mlen = -50;
                }
                $('.num-go').css({
                    left: (left + Number(mlen)) + '%'
                })
                $('.yj-num').text(mlen);
            }).mouseup(() => {
                $('.go-box').unbind('mousemove');
            })
        })
    }

    //交易币种 change
    function tradeCoinChange(type) {
        if (type == '0') {
            return $.when(
                TradeCtr.getAdvertisePrice($("#tradeCoin").val()),
                getAccount($("#tradeCoin").val())
            ).then()
        } else if (type == '1') {
            return $.when(
                getAccount($("#tradeCoin").val())
            ).then()
        }

    }

});