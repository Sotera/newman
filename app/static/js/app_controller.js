
/**
 * application controller container
 * document ready
 */
$(function () {
    "use strict";

    // initialize all data-source

    try {
        var datasetsParam = decodeURIComponent($.urlParam('datasets'));
        var datasets = JSON.parse(datasetsParam).datasets;
        if (datasets != null)
            newman_data_source.setSelectedDatasetsOnStartup(datasets);
    }
    catch (err) {
        console.log("error parsing startup datasets.");
    }


    newman_data_source.requestDataSourceAll(function () {

        var searchVal = $.urlParam('query');
        if (searchVal != null) {
            $("#txt_search").val(searchVal);
            app_graph_model.searchByField();
        }


        //});
    });
    setTimeout(function () {
        // initialize analytics displays
        email_analytics_content.init();

        // initialize document displays
        email_doc_view_panel.init();

        dashboard_content.init();

        // initialize email view panel
        email_doc_view_panel.init();

        // initialize navigation-history
        app_nav_history.init();

        // initialize status indicator
        app_status_indicator.initStatus();


        $("[rel=tooltip]").tooltip();


        $('a[data-toggle=\"tab\"]').on('shown.bs.tab', function (e) {
            //var element_ID = $(e.target).html();
            var element_ID = $(e.target).attr("href");
            console.log('tab_selected : ' + element_ID);

            if (element_ID.endsWith('dashboard_tab_chart_analytics')) {
                app_dashboard.initDashboardCharts();

                //app_pagination_control.initPageControl( newman_search_result_collection );
            }
            else if (element_ID.endsWith('dashboard_tab_geo_analytics')) {
                app_geo_map.init(true);

                //app_pagination_control.initPageControl( app_geo_map );
            }
            else if (element_ID.endsWith('dashboard_tab_data_extract')) {
                //app_text_extract_table.requestExtractPhoneList();

                app_pagination_control.initPageControl(app_text_extract_table);
            }
            else if (element_ID.endsWith('dashboard_tab_ingest_status')) {

                //app_email_ingest.requestIngestStatus();
            }
            else if (element_ID.endsWith('dashboard_tab_content_entities')) {
                newman_top_email_entity.revalidateUIEntityEmail();
            }
            else if (element_ID.endsWith('dashboard_tab_content_topics')) {
                newman_top_email_topic.revalidateUITopicEmail();
            }
            else if (element_ID.endsWith('dashboard_tab_content_ranks')) {
                newman_top_email_account.revalidateUIRankEmail();
            }
            else if (element_ID.endsWith('dashboard_tab_content_domains')) {
                newman_top_email_domain.revalidateUIDomain();
            }
            else if (element_ID.endsWith('dashboard_tab_content_communities')) {
                newman_top_email_community.revalidateUICommunity();
            }
            else if (element_ID.endsWith('dashboard_tab_content_attach_activities')) {
                newman_activity_attachment.revalidateUIActivityAttach();
            }
            else if (element_ID.endsWith('dashboard_tab_content_attach_types')) {
                newman_top_email_attach_type.revalidateUIFileTypeAttach();
            }
            else if (element_ID.endsWith('attachment-table-tab')) {
                //do nothing at this level
            }
            else {
                console.log('Tab-selected "' + element_ID + '" default event handling...');
                // default to dashboard
                app_dashboard.initDashboardCharts();

                //app_pagination_control.initPageControl( newman_search_result_collection );
            }

        });


        $('a[data-toggle=\"tab\"]').on('hidden.bs.tab', function (e) {
            var element_ID = $(e.target).attr("href");

            //if (element_ID.endsWith('dashboard_tab_data_extract') || element_ID.endsWith('dashboard_tab_geo_analytics')) {
            if (element_ID.endsWith('dashboard_tab_data_extract')) {
                console.log('tab_unselected :' + element_ID);

                app_pagination_control.hidePageControl();
            }

        });


        newman_graph_email.initUI();
        app_tree_email.initUI();


    }, 3000); //end of setTimeout


});

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
        return null;
    }
    else{
        return decodeURI(results[1]) || 0;
    }
};
