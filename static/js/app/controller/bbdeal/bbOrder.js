define([
            'app/controller/base',
            'app/util/ajax',
            'app/interface/GeneralCtr',
            'pagination',
            'app/interface/AccountCtr'
        ], function(base, Ajax, GeneralCtr, pagination, AccountCtr) {
            let hisConfig = {
                userId: base.getUserId(),
                start: '1',
                limit: '10'
            };

            let userHistoryData = []; //用户历史委托数据
            let userMxData = []; // 用户明细
            let statusValueList = {}; // 状态

            init();

            function init() {
                // 判断是否登录
                if (!base.isLogin()) {
                    base.goLogin();
                    return false;
                } else {
                    //状态
                    GeneralCtr.getDictList({ "parentKey": "simu_order_status" }).then((data) => {
                        data.forEach(function(item) {
                            statusValueList[item.dkey] = item.dvalue
                        })
                    }, base.hideLoadingSpin)
                    getMyHistoryData(hisConfig).then(data => {
                                userHistoryData = data.list;
                                if (userHistoryData.length == 0) {
                                    $('.no-data').removeClass('hidden');
                                    return;
                                }
                                let hisToryHtml = '';
                                userHistoryData.forEach(item => {
                                            hisToryHtml += `<li>
                        <div class="list-l">
                            <span>${base.formatDate(item.createDatetime)}</span>
                            <span>${item.symbol}/${item.toSymbol}</span>
                            <span class="${item.direction == 0 ? 'or-mr' : 'or-mc'}">${item.direction == 0 ? '买入' : '卖出'}</span>
                            <span>${item.type == 0 ? '市价' : '限价'}</span>
                            <span>${base.formatMoney(`${item.price}`, '', item.toSymbol)}</span>
                            <span>${item.totalCount}</span>
                            <span>${item.totalAmount}</span>
                            <span>${item.tradedCount}</span>
                            <span>${item.totalCount - item.tradedCount}</span>
                            <span>${item.tradedAmount}</span>
                            <span>${statusValueList[item.status]}</span>
                            <span>
                                <button data-code="${item.code}" data-status="${item.status}" class="his-detail ${item.status == 4 ? 'dis-btn' : ''}">详情</button>
                            </span>
                        </div>
                        <ul class="det-l">
                            
                        </ul>
                    </li>`
                })
                $('.bborder-ul').html(hisToryHtml);
                addLister();
                /* 
                
                            
                 */
            })
        }

    }


    // 初始化交易记录分页器
    function initPagination(data) {
        $("#pagination .pagination").pagination({
            pageCount: data.totalPage,
            showData: config.limit,
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
                if (_this.getCurrent() != config.start) {
                    base.showLoadingSpin();
                    config.start = _this.getCurrent();
                    getInvitationHistory(config);
                }
            }
        });
    }
    // 分页查询我的历史委托单
    function getMyHistoryData(config) {
        return Ajax.post('650059', config);
    }

    function getMyDetailData(code) {
        return Ajax.post('650057', {
            orderCode: code,
            userId: base.getUserId(),
            start: '1',
            limit: '10'
        })
    }

    function addLister() {
        $('.his-detail').off('click').click(function() {
            let code = $(this).attr('data-code');
            let status = $(this).attr('data-status');
            getMyDetailData(code).then(data => {
                userMxData = data.list;
                let userMxHtml = `<div>
                    <span>时间</span>
                    <span>价格</span>
                    <span>数量</span>
                    <span>成交额</span>
                    <span>手续费</span>
                </div>`;
                userMxData.forEach(item => {
                    userMxHtml += `<li>
                        <div>
                            <span>${base.formatDate(item.createDatetime)}</span>
                            <span>${item.tradedPrice}</span>
                            <span>${item.tradedCount}</span>
                            <span>${item.tradedAmount}</span>
                            <span>${item.tradedFee}</span>
                        </div>
                    </li>`
                })
                if (status != 4) {
                    $(this).parent().parent().next().html(userMxHtml).slideToggle(300);
                }
            })
        })
    }
})