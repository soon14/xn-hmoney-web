define([
            'app/controller/base',
            'pagination',
            'app/util/ajax'
        ], function(base, pagination, Ajax) {

            let userCTSList = [];

            let statusList = {
                '0': '待支付',
                '1': '待确认',
                '2': '已完成',
                '3': '已取消',
                '4': '平台已取消'
            }
            let typeList = {
                '0': '买入',
                '1': '卖出'
            }

            let j_config = {
                limit: '10',
                start: '1',
                userId: base.getUserId()
            }

            init();

            function init() {
                base.showLoadingSpin();
                addListener();
                getCTSData(j_config).then(data => {
                            userCTSList = data.list;
                            let ctsHtml = '';
                            userCTSList.forEach(item => {
                                        let pHtml = '';
                                        if (item.type == 0) {
                                            switch (item.status) {
                                                case '0':
                                                    pHtml = `<p>
                <span>标记付款</span>
                <span>取消订单</span>
                <span class="goHref" data-href="../wallet/wallet-det.html?code=${item.code}">详情</span>
            </p>`;
                                                    break;
                                                default:
                                                    pHtml = `<p>
                                                <span class="goHref" data-href="../wallet/wallet-det.html?code=${item.code}">详情</span>
                                            </p>`;
                                            }
                                        }
                                        if (item.type == 1) {
                                            switch (item.status) {
                                                case '0':
                                                    pHtml = `<p>
                <span>取消订单</span>
                <span class="goHref" data-href="../wallet/wallet-det.html?code=${item.code}">详情</span>
            </p>`;
                                                    break;
                                                default:
                                                    pHtml = `<p>
                                                <span class="goHref" data-href="../wallet/wallet-det.html?code=${item.code}">详情</span>
                                            </p>`;
                                            }
                                        }

                                        ctsHtml += `<li>
            <p class="${item.type == 0 ? 'd-mr': 'd-mc'}">${typeList[item.type]}</p>
            <p>${item.tradeCurrency}</p>
            <p>${item.tradeAmount}</p>
            <p>$</p>
            <p class="date_num">${base.formatMoney(`${item.count}`, '', 'X')}</p>
            <p class="date_p">${base.formateDatetime(item.createDatetime)}</p>
            <p>${statusList[item.status]}</p>
            <div class="cz-type" data-code="${item.code}">
                ${pHtml}
            </div>
        </li>`
    });

    $('.x-order_warp ul').html(ctsHtml);
    j_config.start == 1 && initPagination(data);
    addListener();
    base.hideLoadingSpin();

    }, base.hideLoadingSpin)
}

    // 初始化交易记录分页器
    function initPagination(data) {
        $("#pagination .pagination").pagination({
            pageCount: data.totalPage,
            showData: j_config.limit,
            jump: true,
            coping: true,
            prevContent: '<img src="/static/images/arrow---left.png" />',
            nextContent: '<img src="/static/images/arrow---right.png" />',
            keepShowPN: true,
            totalData: data.totalCount,
            jumpIptCls: 'pagination-ipt',
            jumpBtnCls: 'pagination-btn',
            jumpBtn: '确定',
            isHide: true,
            callback: function(_this) {
                if (_this.getCurrent() != j_config.start) {
                    base.showLoadingSpin();
                    j_config.start = _this.getCurrent();
                    getCTSData(j_config);
                }
            }
        });
    }

    //查询我的承兑商信息
    function getCTSData(j_config) {
        return Ajax.get('625287', j_config);
    }

    // 标记付款
    function bjPlayfo(config){
        return Ajax.get('625273', config);
    }

    // 取消订单
    function qxOrder(config){
        return Ajax.get('625272', config)
    }


    function addListener(){
        $('.cz-type span').off('click').click(function(){
            let selTxt = $(this).text();
            let code = $(this).parents('.cz-type').data('code');
            let config = {
                userId: base.getUserId(),
                code
            };
            switch(selTxt){
                case '标记付款': 
                    bjPlayfo(config).then(() => {
                        location.reload();
                    });
                    break;
                case '取消订单': 
                    qxOrder(config).then(() => {
                        location.reload();
                    });
                    break;
            }
        })
    }
});